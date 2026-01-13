import { Types } from "mongoose";

import { createError } from "../../utils/error";
import { getCurrentRate } from "../rates/rates.service";

import { Price } from "./price.model";
import { Product } from "./product.model";
import { IPrice, IProduct, PriceType } from "./product.types";

// ----------------------------------------------------------------------
// Pricing Logic
// ----------------------------------------------------------------------

const evaluateFormula = (
  formula: string,
  variables: Record<string, number>
) => {
  try {
    const keys = Object.keys(variables);
    const values = Object.values(variables);
    const calculator = new Function(...keys, `return ${formula};`);
    return calculator(...values);
  } catch (err) {
    console.error(`Error evaluating formula: ${formula}`, err);
    return 0;
  }
};

const calculateFinalPrice = async (product: IProduct, price: IPrice) => {
  if (price.type === PriceType.FIXED) {
    return {
      finalPrice: price.baseValue,
      currency: price.currency,
      breakdown: { base: price.baseValue },
    };
  }

  // Dynamic Pricing
  if (!price.formula)
    return { finalPrice: 0, error: "No formula for dynamic price" };

  // 1. Get Rate
  const material = product.attributes.get("material")?.toLowerCase();
  const purity = product.attributes.get("purity");

  let currentRate = 0;

  if (material && purity) {
    currentRate = await getCurrentRate(material, purity);
  }

  // 3. Prepare variables
  const weight = product.attributes.get("weight") || 0;

  const variables = {
    weight: Number(weight),
    rate: Number(currentRate),
    baseValue: price.baseValue, // Making charges etc
    makingCharges: price.baseValue, // Alias
  };

  const calculated = evaluateFormula(price.formula, variables);

  return {
    finalPrice: calculated,
    currency: price.currency,
    breakdown: {
      rateUsed: currentRate,
      variables,
      formula: price.formula,
    },
  };
};

// ----------------------------------------------------------------------
// Product CRUD
// ----------------------------------------------------------------------

export const createProduct = async (
  productData: Partial<IProduct>,
  priceData: Partial<IPrice>
) => {
  // 1. Create Product
  const product = new Product(productData);
  await product.save();

  // 2. Create Price linked to Product
  const price = new Price({
    ...priceData,
    productId: product._id,
  });
  await price.save();

  // 3. Link Price to Product
  product.priceId = price._id as Types.ObjectId;
  await product.save();

  return product;
};

export const getProductById = async (id: string) => {
  const product = await Product.findById(id).populate("priceId");
  if (!product) throw createError(404, "Product not found");

  // Calculate Price on the fly
  let pricingDetails = null;

  if (product.priceId && "baseValue" in (product.priceId as object)) {
    const priceDoc = product.priceId as IPrice;
    pricingDetails = await calculateFinalPrice(product, priceDoc);
  }

  return {
    ...product.toObject(),
    pricing: pricingDetails,
  };
};

export const getAllProducts = async () => {
  return Product.find().populate("priceId");
};
