import bcrypt from "bcryptjs";
import { PrismaClient, RoleName } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      create: { name },
      update: {}
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.ADMIN } });
  await prisma.user.upsert({
    where: { email: "admin@klinik.local" },
    create: {
      name: "Administrator Klinik",
      email: "admin@klinik.local",
      passwordHash: await bcrypt.hash("Admin12345", 12),
      roleId: adminRole.id
    },
    update: {}
  });

  const polyclinics = [
    { name: "Poli Umum", code: "UMUM", queuePrefix: "A" },
    { name: "Poli Gigi", code: "GIGI", queuePrefix: "G" },
    { name: "Poli Anak", code: "ANAK", queuePrefix: "C" },
    { name: "Poli Mata", code: "MATA", queuePrefix: "M" },
    { name: "Kasir", code: "KASIR", queuePrefix: "K" },
    { name: "Apotek", code: "APOTEK", queuePrefix: "O" }
  ];

  for (const item of polyclinics) {
    await prisma.polyclinic.upsert({
      where: { code: item.code },
      create: item,
      update: item
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
