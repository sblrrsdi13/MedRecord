import { randomUUID } from "node:crypto";
import type { RoleName } from "@prisma/client";
import { STAFF_ROLES } from "../../constants/roles.js";
import { prisma } from "../../config/prisma.js";
import type { AnnouncementPayload } from "./announcement.schema.js";

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

export async function listAnnouncements(role: RoleName) {
  await ensureAnnouncementTable();
  const staffCanManage = STAFF_ROLES.some((staffRole) => staffRole === role);
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

  return rows.map(mapRow);
}

export async function createAnnouncement(payload: AnnouncementPayload, userId: string) {
  await ensureAnnouncementTable();
  const id = randomUUID();
  const { title, content, category, isActive } = payload;

  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    insert into portal_announcements (id, title, content, category, is_active, created_by, created_at, updated_at)
    values (${id}, ${title}, ${content}, ${category}, ${isActive}, ${userId}, now(), now())
    returning id, title, content, category, is_active as "isActive", created_by as "createdBy", null as "authorName", null as "authorEmail", created_at as "createdAt", updated_at as "updatedAt"
  `;

  return mapRow(rows[0]);
}

export async function updateAnnouncement(id: string, payload: AnnouncementPayload) {
  await ensureAnnouncementTable();
  const { title, content, category, isActive } = payload;
  const rows = await prisma.$queryRaw<AnnouncementRow[]>`
    update portal_announcements
    set title = ${title},
        content = ${content},
        category = ${category},
        is_active = ${isActive},
        updated_at = now()
    where id = ${id}
    returning id, title, content, category, is_active as "isActive", created_by as "createdBy", null as "authorName", null as "authorEmail", created_at as "createdAt", updated_at as "updatedAt"
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteAnnouncement(id: string) {
  await ensureAnnouncementTable();
  await prisma.$executeRaw`
    delete from portal_announcements
    where id = ${id}
  `;

  return { deleted: true };
}
