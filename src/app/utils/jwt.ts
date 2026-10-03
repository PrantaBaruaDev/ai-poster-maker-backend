import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";

const createToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string,
): string => {
  const token = jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
  return token;
};

const verifyToken = (token: string, secret: string) => {
  try {
    const verifiedToken = jwt.verify(token, secret) as JwtPayload;
    return {
      success: true as const,
      data: verifiedToken,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Token verification failed";
    console.log("Token verification failed:", message);
    return {
      success: false as const,
      error: message,
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};