import type { Request, Response } from "express";
import { adminService } from "./admin.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../errors/ApiError";
import { listPostersQuerySchema, toggleFlagSchema } from "./admin.validation";

const getParamString = (
  value: string | string[] | undefined,
  name: string,
): string => {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) throw new ApiError(400, `Missing param: ${name}`);
  return v;
};

export const adminController = {
  listTemplates: catchAsync(async (_req: Request, res: Response) => {
    const templates = await adminService.listTemplates();
    sendResponse(res, 200, {
      data: { templates },
      meta: { total: templates.length },
    });
  }),

  createTemplate: catchAsync(async (req: Request, res: Response) => {
    const template = await adminService.createTemplate(req.body);
    sendResponse(res, 201, {
      message: "Template created",
      data: { template },
    });
  }),

  updateTemplate: catchAsync(async (req: Request, res: Response) => {
    const id = getParamString(req.params.id, "id");
    const template = await adminService.updateTemplate(id, req.body);
    sendResponse(res, 200, {
      message: "Template updated",
      data: { template },
    });
  }),

  deleteTemplate: catchAsync(async (req: Request, res: Response) => {
    const id = getParamString(req.params.id, "id");
    const template = await adminService.deactivateTemplate(id);
    sendResponse(res, 200, {
      message: "Template deactivated",
      data: { template },
    });
  }),

  listPosters: catchAsync(async (req: Request, res: Response) => {
    const parsed = listPostersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid query parameters");
    }

    const result = await adminService.listPosters(parsed.data);
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

  setFlag: catchAsync(async (req: Request, res: Response) => {
    const id = getParamString(req.params.id, "id");
    const parsed = toggleFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid body");
    }

    const poster = await adminService.setPosterFlag(id, parsed.data.isFlagged);
    sendResponse(res, 200, {
      message: parsed.data.isFlagged ? "Poster flagged" : "Poster unflagged",
      data: { poster: { id: poster.id, isFlagged: poster.isFlagged } },
    });
  }),

  deletePoster: catchAsync(async (req: Request, res: Response) => {
    const id = getParamString(req.params.id, "id");
    await adminService.deletePoster(id);
    res.status(204).send();
  }),
};