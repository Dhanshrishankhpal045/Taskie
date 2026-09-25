import "dotenv/config";

import {
  NextFunction,
  Request,
  Response,
} from "express";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured in the environment."
    );
  }

  return secret;
};

interface JwtPayload {
  userId?: string;
  iat?: number;
  exp?: number;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const parts =
      authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !==
        "bearer" ||
      !parts[1]
    ) {
      res.status(401).json({
        message:
          "Invalid authentication format.",
      });
      return;
    }

    const token = parts[1];

    const decoded =
      jwt.verify(
        token,
        getJwtSecret()
      ) as JwtPayload;

    if (
      !decoded ||
      typeof decoded.userId !==
        "string" ||
      !decoded.userId.trim()
    ) {
      res.status(401).json({
        message:
          "Invalid authentication token.",
      });
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        decoded.userId
      )
    ) {
      res.status(401).json({
        message:
          "Invalid authentication token.",
      });
      return;
    }

    req.userId = decoded.userId;

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    res.status(401).json({
      message:
        "Invalid or expired authentication token.",
    });
  }
};