import { REACH_PER_DOLLAR, REACH_LOW, REACH_HIGH } from "./config";
import { ReachEstimate } from "../types";

/**
 * Pure function to calculate estimated audience reach from net advertising budget.
 * Always explicitly tagged as 'Estimated, not guaranteed'.
 */
export function estimateReach(adDollars: number): ReachEstimate {
  const safeDollars = Math.max(0, Number(adDollars) || 0);
  const mid = Math.round(safeDollars * REACH_PER_DOLLAR);
  const low = Math.round(mid * REACH_LOW);
  const high = Math.round(mid * REACH_HIGH);

  return {
    low,
    mid,
    high,
    formattedRange: `${low.toLocaleString()} – ${high.toLocaleString()} people`,
    disclaimer:
      "Estimated, not guaranteed. Actual audience delivery depends on platform ad auctions, inventory availability, and regional targeting dynamics.",
  };
}
