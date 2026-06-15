"use client";

export const RESOURCE_CHANGED_EVENT = "clinic:resource-changed";

export function emitResourceChanged(resource: string) {
  window.dispatchEvent(new CustomEvent(RESOURCE_CHANGED_EVENT, { detail: { resource } }));
}

export function normalizeResourceName(resource: string) {
  return resource.replace(/^\//, "").split("?")[0];
}
