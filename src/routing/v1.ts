import { Router } from "express";

import { healthRoutes } from "../modules/health/health.routes";
import orderRouter from "../modules/order/order.routes";
import paymentRouter from "../modules/payment/payment.routes";
import { productRouter } from "../modules/product/product.routes";
import { ratesRouter } from "../modules/rates/rates.routes";
import { userRouter } from "../modules/user/user.routes";

export const v1Router = Router();

v1Router.use("/health", healthRoutes);
v1Router.use("/user", userRouter);
v1Router.use("/rates", ratesRouter);
v1Router.use("/product", productRouter);
v1Router.use("/orders", orderRouter);
v1Router.use("/payments", paymentRouter);
