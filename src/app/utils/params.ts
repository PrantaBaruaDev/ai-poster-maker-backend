import { ApiError } from "../errors/ApiError";

export const requireParam = (
  value: string | string[] | undefined,
  name: string,
): string => {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) throw new ApiError(400, `Missing param: ${name}`);
  return v;
};