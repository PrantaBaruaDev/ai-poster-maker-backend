import type { Request, Response } from "express";
import { posterService } from "./poster.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../errors/ApiError";

const getParamString = (
  value: string | string[] | undefined,
  name: string,
): string => {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) throw new ApiError(400, `Missing param: ${name}`);
  return v;
};

export const posterController = {
  create: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const result = await posterService.create(req.user.id, req.body);
    sendResponse(res, 202, {
      message: "Poster generation started",
      data: result,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const id = getParamString(req.params.id, "id");
    const isAdmin = req.user.role === "ADMIN";

    const poster = await posterService.getById(req.user.id, id, isAdmin);
    sendResponse(res, 200, { data: { poster } });
  }),

  history: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

    const result = await posterService.history(req.user.id, page, limit);
    sendResponse(res, 200, {
      data: { posters: result.items },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  }),

  regenerate: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const id = getParamString(req.params.id, "id");
    const result = await posterService.regenerate(req.user.id, id, req.body);

    sendResponse(res, 202, {
      message: "Regeneration started",
      data: result,
    });
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, "Not authenticated");

    const id = getParamString(req.params.id, "id");
    const isAdmin = req.user.role === "ADMIN";

    await posterService.delete(req.user.id, id, isAdmin);
    res.status(204).send();
  }),
};