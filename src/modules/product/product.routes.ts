import { Router } from "express";

import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

import * as productController from "./product.controller";

export const productRouter = Router();

productRouter.get("/", productController.getProducts);
productRouter.get("/:id", productController.getProductById);

productRouter.use(authenticate);

productRouter.post("/", requireAdmin, productController.createProduct);
