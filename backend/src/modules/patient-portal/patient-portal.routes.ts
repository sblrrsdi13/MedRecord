import { Router } from "express";
import { RoleName } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ok } from "../../utils/api-response.js";

export const patientPortalRoutes = Router();

patientPortalRoutes.use(authenticate, authorize([RoleName.PATIENT]));

function money(value: unknown) {
  return Number(value ?? 0);
}

type PortalPayment = {
  id: string;
  invoiceNo: string;
  visitId: string;
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  paymentMethod: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  details: Array<{
    id: string;
    itemName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  isDraft?: boolean;
};

const patientProfileSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(8).max(30).optional().or(z.literal("")),
  nik: z.string().min(8).max(32),
  birthDate: z.coerce.date(),
  gender: z.enum(["MALE", "FEMALE"]),
  bloodType: z.string().max(5).optional().or(z.literal("")),
  address: z.string().min(5).max(500),
  allergyNotes: z.string().max(500).optional().or(z.literal(""))
});

patientPortalRoutes.get("/me", async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: req.user?.id },
    include: {
      visits: {
        include: {
          polyclinic: true,
          doctor: { include: { user: { select: { name: true } } } },
          queue: true,
          vitalSign: true,
          medicalRecord: {
            include: {
              doctor: { include: { user: { select: { name: true } } } },
              prescription: { include: { items: { include: { medicine: true } } } }
            }
          },
          payment: { include: { details: true } }
        },
        orderBy: { visitDate: "desc" }
      }
    }
  });

  if (!patient) {
    return ok(res, {
      patient: null,
      visits: [],
      medicalRecords: [],
      prescriptions: [],
      payments: [],
      queues: []
    }, "Akun pasien belum terhubung dengan data pasien");
  }

  const medicalRecords = patient.visits.flatMap((visit) => visit.medicalRecord ? [visit.medicalRecord] : []);
  const prescriptions = medicalRecords.flatMap((record) => record.prescription ? [record.prescription] : []);
  const payments = patient.visits.flatMap<PortalPayment>((visit) => {
    if (visit.payment) {
      return [{
        id: visit.payment.id,
        invoiceNo: visit.payment.invoiceNo,
        visitId: visit.payment.visitId,
        subtotal: money(visit.payment.subtotal),
        discount: money(visit.payment.discount),
        total: money(visit.payment.total),
        paidAmount: money(visit.payment.paidAmount),
        paymentMethod: visit.payment.paymentMethod,
        status: visit.payment.status,
        createdAt: visit.payment.createdAt,
        updatedAt: visit.payment.updatedAt,
        details: visit.payment.details.map((detail) => ({
          id: detail.id,
          itemName: detail.itemName,
          quantity: detail.quantity,
          price: money(detail.price),
          total: money(detail.total)
        }))
      }];
    }
    if (visit.status !== "ready_to_pay" && visit.status !== "prescribed") return [];

    const details: PortalPayment["details"] = [
      {
        id: `consultation-${visit.id}`,
        itemName: `Biaya konsultasi ${visit.polyclinic.name}`,
        quantity: 1,
        price: money(visit.polyclinic.consultationFee),
        total: money(visit.polyclinic.consultationFee)
      }
    ];

    if (visit.medicalRecord && money(visit.medicalRecord.treatmentFee) > 0) {
      details.push({
        id: `treatment-${visit.medicalRecord.id}`,
        itemName: visit.medicalRecord.treatment || "Biaya tindakan",
        quantity: 1,
        price: money(visit.medicalRecord.treatmentFee),
        total: money(visit.medicalRecord.treatmentFee)
      });
    }

    visit.medicalRecord?.prescription?.items.forEach((item) => {
      details.push({
        id: `medicine-${item.id}`,
        itemName: item.medicine.name,
        quantity: item.quantity,
        price: money(item.medicine.price),
        total: money(item.medicine.price) * item.quantity
      });
    });

    const total = details.reduce((sum, item) => sum + money(item.total), 0);
    return [{
      id: `draft-${visit.id}`,
      invoiceNo: `DRAFT-${visit.visitNo}`,
      visitId: visit.id,
      subtotal: total,
      discount: 0,
      total,
      paidAmount: 0,
      paymentMethod: null,
      status: "unpaid",
      createdAt: visit.updatedAt,
      updatedAt: visit.updatedAt,
      details,
      isDraft: true
    }];
  });
  const queues = patient.visits.flatMap((visit) => visit.queue ? [visit.queue] : []);

  return ok(res, { patient, visits: patient.visits, medicalRecords, prescriptions, payments, queues });
});

patientPortalRoutes.patch("/payments/:id/pay", async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
  if (!patient) return ok(res, null, "Akun pasien belum terhubung dengan data pasien");

  const payment = await prisma.payment.findFirst({
    where: {
      id: req.params.id,
      visit: { patientId: patient.id }
    }
  });

  if (!payment) return ok(res, null, "Invoice tidak ditemukan di akun pasien ini");

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paidAmount: payment.total, status: "paid" }
  });

  return ok(res, updated, "Invoice berhasil dibayar");
});

patientPortalRoutes.patch("/profile", async (req, res) => {
  const parsed = patientProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: parsed.error.flatten(),
      data: null
    });
  }

  const input = parsed.data;
  const patient = await prisma.patient.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
  if (!patient) return ok(res, null, "Akun pasien belum terhubung dengan data pasien");

  const emailOwner = await prisma.user.findFirst({
    where: { email: input.email, NOT: { id: req.user!.id } },
    select: { id: true }
  });
  if (emailOwner) return res.status(409).json({ success: false, message: "Email sudah digunakan akun lain", data: null });

  const nikOwner = await prisma.patient.findFirst({
    where: { nik: input.nik, NOT: { id: patient.id } },
    select: { id: true }
  });
  if (nikOwner) return res.status(409).json({ success: false, message: "NIK sudah digunakan pasien lain", data: null });

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: req.user!.id },
      data: { name: input.name, email: input.email, phone: input.phone || null },
      include: { role: true }
    });
    const updatedPatient = await tx.patient.update({
      where: { id: patient.id },
      data: {
        name: input.name,
        nik: input.nik,
        birthDate: input.birthDate,
        gender: input.gender,
        bloodType: input.bloodType || null,
        phone: input.phone || null,
        address: input.address,
        allergyNotes: input.allergyNotes || null
      }
    });
    return { user, patient: updatedPatient };
  });

  return ok(res, {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      phone: result.user.phone,
      role: result.user.role.name
    },
    patient: result.patient
  }, "Profil pasien berhasil diperbarui");
});
