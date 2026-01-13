import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";

import * as productService from "./product.service";

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { product, price } = req.body;
    const result = await productService.createProduct(product, price);
    response(res, result, 201);
  }
);

export const getProducts = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await productService.getAllProducts();
    response(res, result);
  }
);

export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw { status: 400, message: "Product ID is required" };
    const result = await productService.getProductById(id);
    response(res, result);
  }
);
