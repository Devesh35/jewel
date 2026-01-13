import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";

import {
  createOrderController,
  getOrderController,
  getUserOrdersController,
} from "./order.controller";

const router = Router();

router.use(authenticate); // Require login for all order routes

router.post("/", createOrderController);
router.get("/my-orders", getUserOrdersController);
router.get("/:id", getOrderController);

export default router;
