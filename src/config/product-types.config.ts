export const PRODUCT_TYPES = ["gold", "silver", "diamond"] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];
