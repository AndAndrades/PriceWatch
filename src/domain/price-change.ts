export type PriceDirection = "UP" | "DOWN" | "UNCHANGED";

export interface PriceChangeResult {
  changed: boolean;
  direction: PriceDirection;
  difference: number;
  percentage: number;
}

/**
 * Calculates the exact price change difference, direction, and percentage between two prices.
 * Round percentage to 2 decimal places.
 */
export function calculatePriceChange(
  previousPrice: number | null | undefined,
  currentPrice: number
): PriceChangeResult {
  const curr = Number(currentPrice);

  if (previousPrice === null || previousPrice === undefined) {
    return {
      changed: false,
      direction: "UNCHANGED",
      difference: 0,
      percentage: 0,
    };
  }

  const prev = Number(previousPrice);

  if (isNaN(prev) || isNaN(curr)) {
    throw new Error("Invalid price values provided for calculation");
  }

  const diff = curr - prev;

  if (diff === 0) {
    return {
      changed: false,
      direction: "UNCHANGED",
      difference: 0,
      percentage: 0,
    };
  }

  const direction: PriceDirection = diff > 0 ? "UP" : "DOWN";
  const rawPercentage = prev > 0 ? (diff / prev) * 100 : 0;
  const percentage = Math.round(rawPercentage * 100) / 100;

  return {
    changed: true,
    direction,
    difference: diff,
    percentage,
  };
}
