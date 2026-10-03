import { ApiError } from "../../errors/ApiError";
import { templateRepository } from "./template.repository";
import type { ListTemplatesQuery } from "./template.interface";

export const templateService = {
  list: (query: ListTemplatesQuery) =>
    templateRepository.listActive(query.occasion),

  async getById(id: string) {
    const template = await templateRepository.findActiveById(id);
    if (!template) throw new ApiError(404, "Template not found");
    return template;
  },
};