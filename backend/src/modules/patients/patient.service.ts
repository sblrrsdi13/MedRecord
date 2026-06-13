import { prisma } from "../../config/prisma.js";
import { generatePatientCode } from "../../utils/numbering.js";

type PatientCreateData = Parameters<typeof prisma.patient.create>[0]["data"];
type PatientUpdateData = Parameters<typeof prisma.patient.update>[0]["data"];

function normalizePatientData<T extends PatientCreateData | PatientUpdateData>(data: T) {
  return {
    ...data,
    patientCode: data.patientCode === "" ? null : data.patientCode,
    medicalRecordNo: data.medicalRecordNo === "" ? null : data.medicalRecordNo,
    nik: data.nik === "" ? null : data.nik,
    userId: data.userId === "" ? null : data.userId,
    phone: data.phone === "" ? null : data.phone,
    address: data.address === "" ? null : data.address,
    bloodType: data.bloodType === "" ? null : data.bloodType,
    allergyNotes: data.allergyNotes === "" ? null : data.allergyNotes
  };
}

export async function listPatients(input: { page: number; limit: number; search?: string }) {
  const skip = (input.page - 1) * input.limit;
  const where = input.search
    ? {
        OR: [
          { name: { contains: input.search, mode: "insensitive" as const } },
          { patientCode: { contains: input.search, mode: "insensitive" as const } },
          { medicalRecordNo: { contains: input.search, mode: "insensitive" as const } },
          { nik: { contains: input.search, mode: "insensitive" as const } }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: input.limit
    }),
    prisma.patient.count({ where })
  ]);

  return { items, meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
}

export async function createPatient(data: PatientCreateData) {
  return prisma.$transaction(async (tx) => {
    const normalized = normalizePatientData(data);
    return tx.patient.create({
      data: {
        ...normalized,
        patientCode: normalized.patientCode ?? await generatePatientCode(tx)
      }
    });
  });
}

export async function updatePatient(id: string, data: PatientUpdateData) {
  return prisma.patient.update({ where: { id }, data: normalizePatientData(data) });
}
