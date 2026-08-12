// Shared between the storefront (display only) and the order action (the
// authoritative calculation) so they can never drift apart.
export const LABELING_FEE = 120;
export const DELIVERY_FEE = { SCHOOL_BATCH: 25, HOME: 45 } as const;
export type DeliveryMethod = keyof typeof DELIVERY_FEE;
