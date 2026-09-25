import "dotenv/config";

import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not configured in the environment."
    );
  }

  return secret;
};

const createToken = (
  userId: string
): string => {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );
};

const sanitizeUser = (user: {
  _id: unknown;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/* =========================================================
   REGISTER
   ========================================================= */

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    const trimmedName =
      typeof name === "string"
        ? name.trim()
        : "";

    const trimmedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (!trimmedName) {
      res.status(400).json({
        message:
          "Name is required.",
      });
      return;
    }

    if (!trimmedEmail) {
      res.status(400).json({
        message:
          "Email is required.",
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        message:
          "Password is required.",
      });
      return;
    }

    if (
      typeof password !== "string" ||
      password.length < 6
    ) {
      res.status(400).json({
        message:
          "Password must contain at least 6 characters.",
      });
      return;
    }

    const existingUser =
      await User.findOne({
        email: trimmedEmail,
      });

    if (existingUser) {
      res.status(409).json({
        message:
          "An account with this email already exists.",
      });
      return;
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
    });

    const token = createToken(
      String(user._id)
    );

    res.status(201).json({
      message:
        "Account created successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create account.",
    });
  }
};

/* =========================================================
   LOGIN
   ========================================================= */

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
    } = req.body;

    const trimmedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : "";

    if (!trimmedEmail) {
      res.status(400).json({
        message:
          "Email is required.",
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        message:
          "Password is required.",
      });
      return;
    }

    const user =
      await User.findOne({
        email: trimmedEmail,
      });

    if (!user) {
      res.status(401).json({
        message:
          "Invalid email or password.",
      });
      return;
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      res.status(401).json({
        message:
          "Invalid email or password.",
      });
      return;
    }

    const token = createToken(
      String(user._id)
    );

    res.status(200).json({
      message:
        "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to log in.",
    });
  }
};

/* =========================================================
   GET CURRENT USER
   ========================================================= */

export const getMe = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({
        message:
          "Authentication required.",
      });
      return;
    }

    const user =
      await User.findById(
        req.userId
      );

    if (!user) {
      res.status(404).json({
        message:
          "User account was not found.",
      });
      return;
    }

    res.status(200).json({
      message:
        "Current user retrieved successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to retrieve user.",
    });
  }
};

/* =========================================================
   UPDATE PROFILE
   ========================================================= */

export const updateProfile =
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({
          message:
            "Authentication required.",
        });
        return;
      }

      const {
        name,
        email,
      } = req.body;

      const user =
        await User.findById(
          req.userId
        );

      if (!user) {
        res.status(404).json({
          message:
            "User account was not found.",
        });
        return;
      }

      if (
        name !== undefined
      ) {
        if (
          typeof name !==
          "string"
        ) {
          res.status(400).json({
            message:
              "Name must be a string.",
          });
          return;
        }

        const trimmedName =
          name.trim();

        if (!trimmedName) {
          res.status(400).json({
            message:
              "Name is required.",
          });
          return;
        }

        user.name =
          trimmedName;
      }

      if (
        email !== undefined
      ) {
        if (
          typeof email !==
          "string"
        ) {
          res.status(400).json({
            message:
              "Email must be a string.",
          });
          return;
        }

        const trimmedEmail =
          email
            .trim()
            .toLowerCase();

        if (!trimmedEmail) {
          res.status(400).json({
            message:
              "Email is required.",
          });
          return;
        }

        const existingUser =
          await User.findOne({
            email: trimmedEmail,
            _id: {
              $ne: user._id,
            },
          });

        if (existingUser) {
          res.status(409).json({
            message:
              "Another account is already using this email.",
          });
          return;
        }

        user.email =
          trimmedEmail;
      }

      await user.save();

      res.status(200).json({
        message:
          "Profile updated successfully.",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update profile.",
      });
    }
  };