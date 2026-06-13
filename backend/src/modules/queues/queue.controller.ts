import { QueueStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { created, ok } from "../../utils/api-response.js";
import { writeAuditLog } from "../../middleware/audit.middleware.js";
import * as service from "./queue.service.js";

export async function index(req: Request, res: Response) {
  return ok(res, await service.listQueues(req.query as never));
}

export async function store(req: Request, res: Response) {
  const queue = await service.createQueue(req.body);
  await writeAuditLog(req, "create", "queues", queue.id);
  return created(res, queue, "Antrian berhasil dibuat");
}

export async function call(req: Request, res: Response) {
  const queue = await service.changeQueueStatus(req.params.id, QueueStatus.called);
  await writeAuditLog(req, "call", "queues", queue.id);
  return ok(res, queue, "Antrian dipanggil");
}

export async function recall(req: Request, res: Response) {
  const queue = await service.changeQueueStatus(req.params.id, QueueStatus.called);
  await writeAuditLog(req, "recall", "queues", queue.id);
  return ok(res, queue, "Antrian dipanggil ulang");
}

export async function skip(req: Request, res: Response) {
  const queue = await service.changeQueueStatus(req.params.id, QueueStatus.skipped);
  await writeAuditLog(req, "skip", "queues", queue.id);
  return ok(res, queue, "Antrian dilewati");
}

export async function complete(req: Request, res: Response) {
  const queue = await service.changeQueueStatus(req.params.id, QueueStatus.completed);
  await writeAuditLog(req, "complete", "queues", queue.id);
  return ok(res, queue, "Antrian selesai");
}

export async function cancel(req: Request, res: Response) {
  const queue = await service.changeQueueStatus(req.params.id, QueueStatus.cancelled);
  await writeAuditLog(req, "cancel", "queues", queue.id);
  return ok(res, queue, "Antrian dibatalkan");
}
