import type { Response } from "express";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

interface Payload<T> {
  success?: boolean;
  message?: string;
  data?: T;
  meta?: Meta;
}

export const sendResponse = <T>(
  res: Response,
  status: number,
  payload: Payload<T>
) => {
  const { success = true, message, data, meta } = payload;
  res.status(status).json({
    success,
    ...(message !== undefined && { message }),
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  });
};