import mongoose, { Schema } from "mongoose";

import { IPrice, PriceType } from "./product.types";

const PriceSchema = new Schema<IPrice>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    type: { type: String, enum: Object.values(PriceType), required: true },
    baseValue: { type: Number, required: true, default: 0 },
    formula: { type: String },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

export const Price = mongoose.model<IPrice>("Price", PriceSchema);
