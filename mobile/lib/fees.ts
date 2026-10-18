import { PLATFORM_FEE_PCT, PROCESSING_FEE_PCT, PROCESSING_FEE_FIXED } from "./config";
import { FeeCalculation } from "../types";

/**
 * Pure function to calculate itemized fees from contribution amount.
 * Used universally across quote cards, checkout, receipts, and Use of Funds disclosures.
 */
export function calculateFees(amount: number): FeeCalculation {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const platformFee = Math.round(safeAmount * PLATFORM_FEE_PCT * 100) / 100;
  const processingFee = Math.round((safeAmount * PROCESSING_FEE_PCT + PROCESSING_FEE_FIXED) * 100) / 100;
  const totalCharged = Math.round((safeAmount + processingFee) * 100) / 100;
  const availableForAds = Math.round((safeAmount - platformFee) * 100) / 100;

  return {
    amount: Math.round(safeAmount * 100) / 100,
    platformFee,
    platformFeePercent: `${Math.round(PLATFORM_FEE_PCT * 100)}%`,
    processingFee,
    processingFeeFormula: `${(PROCESSING_FEE_PCT * 100).toFixed(1)}% + $${PROCESSING_FEE_FIXED.toFixed(2)}`,
    totalCharged,
    availableForAds,
    disclaimer:
      "Contributions directly fund the advertising and distribution costs of this message. This is not a charitable donation to the cause or creator.",
  };
}
