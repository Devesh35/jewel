import { PRODUCT_TYPES, ProductType } from "../../config/product-types.config";
import { createError } from "../../utils/error";

import { Rates } from "./rates.model";

type RateInput = {
  date?: string; // If not provided, defaults to today YYYY-MM-DD
} & Partial<Record<ProductType, { [purity: string]: number }>>;

const getTodayDateString = () => new Date().toISOString().split("T")[0];

export const setRate = async (data: RateInput) => {
  const date = data.date || getTodayDateString();

  let rateDoc = await Rates.findOne({ date });
  if (!rateDoc) {
    rateDoc = new Rates({ date, products: new Map() });
  }

  // Ensure map exists (migration safety)
  if (!rateDoc.products) {
    rateDoc.products = new Map();
  }

  const timestamp = new Date();

  // Helper to push snapshot
  const pushSnapshot = (
    type: ProductType,
    values: { [key: string]: number } | undefined
  ) => {
    if (values) {
      let snapshots = rateDoc.products.get(type);
      if (!snapshots) {
        snapshots = [];
        rateDoc.products.set(type, snapshots);
      }
      snapshots.push({ timestamp, values: new Map(Object.entries(values)) });
    }
  };

  for (const type of PRODUCT_TYPES) {
    pushSnapshot(type, data[type]);
  }

  await rateDoc.save();
  return rateDoc;
};

export const getRateForDate = async (date: string) => {
  const rate = await Rates.findOne({ date });
  if (!rate) throw createError(404, `No rates found for date ${date}`);
  return rate;
};

export const getLatestRates = async () => {
  const today = getTodayDateString();
  const rate = await Rates.findOne({ date: today });

  // If no rate today, maybe look for most recent?
  // For now, let's return today's or null/error
  if (!rate) {
    // Optional: fallback to previous day?
    const latest = await Rates.findOne().sort({ date: -1 });
    if (!latest) throw createError(404, "No rates available");
    return latest;
  }
  return rate;
};

export const getCurrentRate = async (
  material: string,
  purity: string
): Promise<number> => {
  const ratesDoc = await getLatestRates();
  if (!ratesDoc) return 0;

  const mat = material.toLowerCase();

  if (!PRODUCT_TYPES.includes(mat as ProductType)) return 0;

  const snapshots = ratesDoc.products.get(mat as ProductType);

  if (!snapshots || snapshots.length === 0) return 0;

  const latestSnapshot = snapshots[snapshots.length - 1];
  if (!latestSnapshot || !latestSnapshot.values) return 0;

  // With strict typing, values is Map<string, number>
  if (latestSnapshot.values instanceof Map) {
    return latestSnapshot.values.get(purity) || 0;
  } else {
    // Fallback if somehow it's not a Map (e.g. lean() usage elsewhere, though here it's full doc)
    // In Mongoose document, it should be a Map.
    return (latestSnapshot.values as any)[purity] || 0;
  }
};
