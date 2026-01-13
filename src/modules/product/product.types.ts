import { Document, Types } from "mongoose";

import { ProductType } from "../../config/product-types.config";

// Product

export interface IProductAttributes extends Map<string, any> {
  get(key: "weight"): number | undefined;
  get(key: "dimension"): string | undefined;
  get(key: "purity"): string | undefined;
  get(key: "material"): ProductType | undefined;
  get(key: "carat"): number | undefined;
  get(key: string): any;
}

export interface IProduct extends Document {
  itemId: string;
  name: string;
  stock: number;
  description?: string;
  images: string[];
  attributes: IProductAttributes; // Mongoose Map
  priceId?: Types.ObjectId | IPrice; // Populated or ID
  createdAt: Date;
  updatedAt: Date;
}

// Price

export enum PriceType {
  FIXED = "fixed",
  DYNAMIC = "dynamic",
}

export interface IPrice extends Document {
  productId: Types.ObjectId;
  type: PriceType;
  baseValue: number;
  formula?: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}
