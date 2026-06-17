import { api } from "@/services/api";
import type { ApiResponse } from "@/types/api";

const MASTER_CACHE_TTL = 5 * 60 * 1000;
const masterCache = new Map<string, { expiresAt: number; value: unknown }>();

function resourceRoot(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : path;
}

export async function getResource<T>(path: string, params?: Record<string, unknown>) {
  const response = await api.get<ApiResponse<T>>(path, { params });
  return response.data.data;
}

export async function getCachedResource<T>(path: string, params?: Record<string, unknown>, ttl = MASTER_CACHE_TTL) {
  const key = JSON.stringify([path, params ?? {}]);
  const cached = masterCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  const value = await getResource<T>(path, params);
  masterCache.set(key, { value, expiresAt: Date.now() + ttl });
  return value;
}

export function invalidateCachedResource(path?: string) {
  if (!path) {
    masterCache.clear();
    return;
  }

  for (const key of masterCache.keys()) {
    if (key.includes(`"${path}"`)) masterCache.delete(key);
  }
}

export async function deleteResource<T>(path: string) {
  const response = await api.delete<ApiResponse<T>>(path);
  invalidateCachedResource(resourceRoot(path));
  return response.data.data;
}

export async function updateResource<T>(path: string, payload: Record<string, unknown>) {
  const response = await api.put<ApiResponse<T>>(path, payload);
  invalidateCachedResource(resourceRoot(path));
  return response.data.data;
}



