import { QueueStatus } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { emitQueueEvent } from "../../socket/socket.js";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatQueueNumber(prefix: string, sequence: number) {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export async function listQueues(input: { page: number; limit: number; search?: string; polyclinicId?: string; status?: QueueStatus }) {
  const queueDate = startOfToday();
  const skip = (input.page - 1) * input.limit;
  const where = {
    queueDate,
    polyclinicId: input.polyclinicId,
    status: input.status
  };

  const [items, total] = await Promise.all([
    prisma.queue.findMany({
      where,
      include: { patient: true, polyclinic: true },
      orderBy: [{ sequence: "asc" }],
      skip,
      take: input.limit
    }),
    prisma.queue.count({ where })
  ]);

  return { items, meta: { page: input.page, limit: input.limit, total, totalPages: Math.ceil(total / input.limit) } };
}

export async function createQueue(input: { polyclinicId: string; patientId?: string; visitId?: string }) {
  const queueDate = startOfToday();
  const polyclinic = await prisma.polyclinic.findUnique({ where: { id: input.polyclinicId } });
  if (!polyclinic || !polyclinic.isActive) throw new AppError(404, "Poli tidak ditemukan atau tidak aktif", "POLYCLINIC_NOT_FOUND");

  const queue = await prisma.$transaction(async (tx) => {
    const last = await tx.queue.findFirst({
      where: { polyclinicId: input.polyclinicId, queueDate },
      orderBy: { sequence: "desc" }
    });
    const sequence = (last?.sequence ?? 0) + 1;

    return tx.queue.create({
      data: {
        polyclinicId: input.polyclinicId,
        patientId: input.patientId,
        visitId: input.visitId,
        queueDate,
        sequence,
        queueNumber: formatQueueNumber(polyclinic.queuePrefix, sequence)
      },
      include: { patient: true, polyclinic: true }
    });
  });

  emitQueueEvent("queue:created", { polyclinicId: queue.polyclinicId, queue });
  emitQueueEvent("queue:updated", { polyclinicId: queue.polyclinicId });
  return queue;
}

export async function changeQueueStatus(id: string, status: QueueStatus) {
  const data = {
    status,
    calledAt: status === QueueStatus.called ? new Date() : undefined,
    completedAt: status === QueueStatus.completed ? new Date() : undefined
  };

  const queue = await prisma.queue.update({
    where: { id },
    data,
    include: { patient: true, polyclinic: true }
  });

  const event = status === QueueStatus.called ? "queue:called" : "queue:updated";
  emitQueueEvent(event, { polyclinicId: queue.polyclinicId, queue });
  return queue;
}
