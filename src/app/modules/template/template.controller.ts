import type { Request, Response } from "express";
import { templateService } from "./template.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ApiError } from "../../errors/ApiError";
import { OccasionType } from "@db/enums";
import { requireParam } from "@/app/utils/params";

const VALID_OCCASIONS = new Set(Object.values(OccasionType));

export const templateController = {
  list: catchAsync(async (req: Request, res: Response) => {
    const occasionRaw = req.query.occasion as string | undefined;

    let occasion: (typeof OccasionType)[keyof typeof OccasionType] | undefined;
    if (occasionRaw) {
      if (!VALID_OCCASIONS.has(occasionRaw as never)) {
        throw new ApiError(
          400,
          `Invalid occasion. Allowed: ${[...VALID_OCCASIONS].join(", ")}`,
        );
      }
      occasion = occasionRaw as never;
    }

    const templates = await templateService.list({ occasion });

    sendResponse(res, 200, {
      data: { templates },
      meta: { total: templates.length },
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const id = requireParam(req.params.id, "id");

    if (!id) throw new ApiError(400, "Template id is required");

    const template = await templateService.getById(id);
    sendResponse(res, 200, { data: { template } });
  }),
};