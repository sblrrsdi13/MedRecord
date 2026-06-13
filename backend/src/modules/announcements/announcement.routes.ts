import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { STAFF_ROLES } from "../../constants/roles.js";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { created, ok } from "../../utils/api-response.js";

export const announcementRoutes = Router();

const announcementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(140),
    content: z.string().min(5).max(2000),
    category: z.enum(["info", "education", "warning", "promo"]).default("info"),
    isActive: z.boolean().default(true)
  })
});

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdBy: string | null;
  authorName: string | null;
  authorEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(row: AnnouncementRow) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: row.createdBy ? { id: row.createdBy, name: row.authorName, email: row.authorEmail } : null
  };
}

async function ensureAnnouncementTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS portal_announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'info',
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_by TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS portal_announcements_is_active_created_at_idx
    ON portal_announcements (is_active, created_at)
  `);
}

announcementRoutes.use(authenticate);

announcementRoutes.get("/", async (req, res) => {
  await ensureAnnouncementTable();
  const staffCanManage = STAFF_ROLES.some((role) => role === req.user!.role);
  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    select
      a.id,
      a.title,
      a.content,
      a.category,
      a.is_active as "isActive",
      a.created_by as "createdBy",
      u.name as "authorName",
      u.email as "authorEmail",
      a.created_at as "createdAt",
      a.updated_at as "updatedAt"
    from portal_announcements a
    left join users u on u.id = a.created_by
    where (${staffCanManage} = true or a.is_active = true)
    order by a.created_at desc
    limit 50
  `;

  return ok(res, rows.map(mapRow));
});

announcementRoutes.post("/", authorize(STAFF_ROLES), validate(announcementSchema), async (req, res) => {
  await ensureAnnouncementTable();
  const id = randomUUID();
  const { title, content, category, isActive } = req.body as z.infer<typeof announcementSchema>["body"];

  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    insert into portal_announcements (id, title, content, category, is_active, created_by, created_at, updated_at)
    values (${id}, ${title}, ${content}, ${category}, ${isActive}, ${req.user!.id}, now(), now())
    returning id, title, content, category, is_active as "isActive", created_by as "createdBy", null as "authorName", null as "authorEmail", created_at as "createdAt", updated_at as "updatedAt"
  `;

  return created(res, mapRow(rows[0]), "Konten portal pasien berhasil dibuat");
});

announcementRoutes.put("/:id", authorize(STAFF_ROLES), validate(announcementSchema), async (req, res) => {
  await ensureAnnouncementTable();
  const { title, content, category, isActive } = req.body as z.infer<typeof announcementSchema>["body"];
  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    update portal_announcements
    set title = ${title},
        content = ${content},
        category = ${category},
        is_active = ${isActive},
        updated_at = now()
    where id = ${req.params.id}
    returning id, title, content, category, is_active as "isActive", created_by as "createdBy", null as "authorName", null as "authorEmail", created_at as "createdAt", updated_at as "updatedAt"
  `;

  return ok(res, rows[0] ? mapRow(rows[0]) : null, "Konten portal pasien berhasil diperbarui");
});

announcementRoutes.delete("/:id", authorize(STAFF_ROLES), async (req, res) => {
  await ensureAnnouncementTable();
  await prisma.$executeRaw`
    delete from portal_announcements
    where id = ${req.params.id}
  `;

  return ok(res, { deleted: true }, "Konten portal pasien berhasil dihapus");
});
