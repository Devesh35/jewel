import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";

import {
  getPaymentController,
  initiatePaymentController,
} from "./payment.controller";

const router = Router();

router.use(authenticate);

router.post("/initiate", initiatePaymentController);
router.get("/:id", getPaymentController);

export default router;
