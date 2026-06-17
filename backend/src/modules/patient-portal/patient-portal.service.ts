import { prisma } from "../../config/prisma.js";
import type { PatientProfilePayload } from "./patient-portal.schema.js";

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

export async function getPatientPortalMe(userId: string) {
  const patient = await prisma.patient.findUnique({
    where: { userId },
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
    return {
      data: {
        patient: null,
        visits: [],
        medicalRecords: [],
        prescriptions: [],
        payments: [],
        queues: [],
        summary: {
          visits: 0,
          medicalRecords: 0,
          prescriptions: 0,
          paidPayments: 0,
          pendingPayments: 0,
          queues: 0,
          nextVisit: null
        }
      },
      message: "Akun pasien belum terhubung dengan data pasien"
    };
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
  const paidPayments = payments.filter((payment) => payment.status === "paid" && !payment.isDraft);
  const pendingPayments = payments.filter((payment) => payment.status !== "paid");

  return {
    data: {
      patient,
      visits: patient.visits,
      medicalRecords,
      prescriptions,
      payments,
      queues,
      summary: {
        visits: patient.visits.length,
        medicalRecords: medicalRecords.length,
        prescriptions: prescriptions.length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        queues: queues.length,
        nextVisit: patient.visits[0] ?? null
      }
    }
  };
}

export async function payPatientInvoice(userId: string, paymentId: string) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) return { status: "not-linked" as const, data: null };

  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      visit: { patientId: patient.id }
    }
  });

  if (!payment) return { status: "not-found" as const, data: null };

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paidAmount: payment.total, status: "paid" }
  });

  return { status: "paid" as const, data: updated };
}

export async function updatePatientProfile(userId: string, input: PatientProfilePayload) {
  const patient = await prisma.patient.findUnique({ where: { userId }, select: { id: true } });
  if (!patient) return { status: "not-linked" as const, data: null };

  const emailOwner = await prisma.user.findFirst({
    where: { email: input.email, NOT: { id: userId } },
    select: { id: true }
  });
  if (emailOwner) return { status: "email-conflict" as const, data: null };

  const nikOwner = await prisma.patient.findFirst({
    where: { nik: input.nik, NOT: { id: patient.id } },
    select: { id: true }
  });
  if (nikOwner) return { status: "nik-conflict" as const, data: null };

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
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

  return { status: "updated" as const, data: result };
}
