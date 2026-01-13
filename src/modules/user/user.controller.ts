import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { createError } from "../../utils/error";
import { response } from "../../utils/responses";

import * as userService from "./user.service";
import { IUser, UserStatus } from "./user.types"; // Updated import

// Helper to get userId from request (assuming auth middleware populates this)
const getUserId = (req: Request) => {
  const user = req.user as Partial<IUser>; // Type is now available
  if (!user || (!user._id && !user.keycloakId))
    // Changed sub to keycloakId based on model, or keep sub if it comes from JWT
    throw createError(401, "User not authenticated");

  // If we have local DB ID in token context (best case)
  // If we have local DB ID in token context (best case)
  if (user._id) return String(user._id);
  // If we only have Keycloak ID (sub), we might need to resolve it.
  return user._id ? String(user._id) : undefined;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  // This might be hit by a webhook or manually
  const { user, profile, phone } = req.body;
  const result = await userService.createUser(user, profile, phone);
  response(res, result, 201);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw createError(401, "User not found");
  const profile = await userService.getUserById(userId);
  response(res, profile);
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw createError(401, "User not found");

  const updatedProfile = await userService.updateProfile(userId, req.body);
  response(res, updatedProfile);
});

export const addAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw createError(401, "User not found");
  const updatedProfile = await userService.addAddress(userId, req.body);
  response(res, updatedProfile);
});

export const removeAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) throw createError(401, "User not found");
    const { id } = req.params;
    if (!id) throw createError(400, "Address ID is required");
    const updatedProfile = await userService.removeAddress(userId, id);
    response(res, updatedProfile);
  }
);

export const updatePhone = asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw createError(401, "User not found");
  const updatedPhone = await userService.setPhone(userId, req.body);
  response(res, updatedPhone);
});

export const updateStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) throw createError(400, "User ID is required");

    const { status } = req.body;

    // Verify status is valid
    if (!Object.values(UserStatus).includes(status)) {
      throw createError(400, "Invalid status");
    }

    const updatedUser = await userService.updateUserStatus(
      userId,
      status as UserStatus
    );
    response(res, updatedUser);
  }
);
