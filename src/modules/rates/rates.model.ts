import mongoose, { Schema } from "mongoose";

import { IRateSnapshot, IRates } from "./rates.types";

const RateSnapshotSchema = new Schema<IRateSnapshot>(
  {
    timestamp: { type: Date, default: Date.now },
    values: { type: Map, of: Number, required: true },
  },
  { _id: false }
);

const RatesSchema = new Schema<IRates>(
  {
    date: { type: String, required: true, unique: true, index: true },
    products: {
      type: Map,
      of: [RateSnapshotSchema],
      default: {},
    },
  },
  { timestamps: true }
);

export const Rates = mongoose.model<IRates>("Rates", RatesSchema);
