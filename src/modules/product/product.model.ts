import mongoose, { Schema } from "mongoose";

import { IProduct } from "./product.types";

const ProductSchema = new Schema<IProduct>(
  {
    itemId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    stock: { type: Number, default: 0 },
    description: { type: String },
    images: [{ type: String }],
    attributes: { type: Map, of: Schema.Types.Mixed }, // Flexible attributes
    priceId: { type: Schema.Types.ObjectId, ref: "Price" },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
