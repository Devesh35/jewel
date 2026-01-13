import { Router } from "express";

import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

import * as userController from "./user.controller";

export const userRouter = Router();

// Routes
userRouter.post("/register", userController.register); // Public or Protected?

userRouter.use(authenticate); // Apply auth to following routes

userRouter.get("/me", userController.getMe);
userRouter.put("/me", userController.updateMe);

userRouter.post("/address", userController.addAddress);
userRouter.delete("/address/:id", userController.removeAddress);

userRouter.put("/phone", userController.updatePhone);

// Admin Routes
userRouter.patch("/status/:userId", requireAdmin, userController.updateStatus);
