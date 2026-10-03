import { randomUUID } from "node:crypto";

export const buildPublicId = (userId: string, originalName: string) => {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "jpg";
  const unique = randomUUID().replace(/-/g, "").slice(0, 12); // 12-char token
  const timestamp = Date.now();
  return `${userId}_${timestamp}_${unique}`;
};