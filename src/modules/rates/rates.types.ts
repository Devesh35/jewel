import { Document } from "mongoose";

import { ProductType } from "../../config/product-types.config";

export interface IRateSnapshot {
  timestamp: Date;
  values: Map<string, number>;
}

export interface IRates extends Document {
  date: string; // YYYY-MM-DD
  products: Map<ProductType, IRateSnapshot[]>;
  createdAt: Date;
  updatedAt: Date;
}
