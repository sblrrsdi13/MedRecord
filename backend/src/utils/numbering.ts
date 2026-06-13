import crypto from "node:crypto";

const CMS_KEY = "site_cms";

const defaultNumberingSettings = {
  patientCodePrefix: "PS",
  patientCodeSequenceLength: 4,
  visitPrefix: "V",
  visitSequenceLength: 4,
  invoicePrefix: "INV",
  invoiceSequenceLength: 6
};

type NumberingDb = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  patient: {
    count: (args: { where: { patientCode: { startsWith: string } } }) => Promise<number>;
    findUnique: (args: { where: { patientCode: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  };
  visit: {
    count: (args: { where: { visitNo: { startsWith: string } } }) => Promise<number>;
    findUnique: (args: { where: { visitNo: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  };
  payment: {
    count: (args: { where: { invoiceNo: { startsWith: string } } }) => Promise<number>;
    findUnique: (args: { where: { invoiceNo: string }; select: { id: true } }) => Promise<{ id: string } | null>;
  };
};

type SiteCmsNumbering = typeof defaultNumberingSettings;

async function getNumberingSettings(db: NumberingDb): Promise<SiteCmsNumbering> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const rows = await db.$queryRawUnsafe<Array<{ value?: Partial<SiteCmsNumbering> }>>(
      `SELECT value FROM site_settings WHERE key = $1 LIMIT 1`,
      CMS_KEY
    );
    return { ...defaultNumberingSettings, ...(rows[0]?.value ?? {}) };
  } catch {
    return defaultNumberingSettings;
  }
}

function sequenceText(value: number, length: number) {
  return String(value).padStart(Math.max(Number(length) || 4, 1), "0");
}

export async function generatePatientCode(db: NumberingDb) {
  const settings = await getNumberingSettings(db);
  const year = new Date().getFullYear();
  const prefix = `${settings.patientCodePrefix}${year}`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const sequence = await db.patient.count({ where: { patientCode: { startsWith: prefix } } });
    const candidate = `${prefix}${sequenceText(sequence + attempt + 1, settings.patientCodeSequenceLength)}`;
    const existing = await db.patient.findUnique({ where: { patientCode: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `${prefix}${crypto.randomInt(1000, 9999)}`;
}

export async function generateVisitNo(db: NumberingDb) {
  const settings = await getNumberingSettings(db);
  const now = new Date();
  const prefix = `${settings.visitPrefix}${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const sequence = await db.visit.count({ where: { visitNo: { startsWith: prefix } } });
    const candidate = `${prefix}${sequenceText(sequence + attempt + 1, settings.visitSequenceLength)}`;
    const existing = await db.visit.findUnique({ where: { visitNo: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `${prefix}${crypto.randomInt(1000, 9999)}`;
}

export async function generateInvoiceNo(db: NumberingDb) {
  const settings = await getNumberingSettings(db);
  const year = new Date().getFullYear();
  const prefix = `${settings.invoicePrefix}${year}`;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const sequence = await db.payment.count({ where: { invoiceNo: { startsWith: prefix } } });
    const candidate = `${prefix}${sequenceText(sequence + attempt + 1, settings.invoiceSequenceLength)}`;
    const existing = await db.payment.findUnique({ where: { invoiceNo: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }

  return `${prefix}${crypto.randomInt(100000, 999999)}`;
}
