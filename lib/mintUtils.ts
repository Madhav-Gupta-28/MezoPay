/**
 * Utility functions for mUSD minting calculations
 */

// Constants from the BorrowerOperations contract
export const MUSD_GAS_COMPENSATION = "200"; // 200 mUSD
export const MIN_COLLATERAL_RATIO = 150; // 150% = 1.5x
export const CRITICAL_COLLATERAL_RATIO = 110; // 110% for recovery mode

/**
 * Calculate collateralization ratio
 * @param btcAmount - Amount of BTC collateral
 * @param btcPrice - Current BTC price in USD
 * @param musdAmount - Amount of mUSD debt
 * @returns Collateralization ratio as a percentage (e.g., 150.5)
 */
export function calculateCollRatio(
  btcAmount: string | number,
  btcPrice: number,
  musdAmount: string | number
): number {
  const btc = typeof btcAmount === "string" ? parseFloat(btcAmount) : btcAmount;
  const musd = typeof musdAmount === "string" ? parseFloat(musdAmount) : musdAmount;

  if (musd === 0 || isNaN(musd) || isNaN(btc)) return 0;

  const collateralValue = btc * btcPrice;
  return (collateralValue / musd) * 100;
}

/**
 * Calculate maximum mUSD that can be minted for given BTC collateral
 * @param btcAmount - Amount of BTC collateral
 * @param btcPrice - Current BTC price in USD
 * @param minRatio - Minimum collateralization ratio (default 150%)
 * @returns Maximum mUSD amount
 */
export function calculateMaxMusd(
  btcAmount: string | number,
  btcPrice: number,
  minRatio: number = MIN_COLLATERAL_RATIO
): number {
  const btc = typeof btcAmount === "string" ? parseFloat(btcAmount) : btcAmount;
  const collateralValue = btc * btcPrice;
  return collateralValue / (minRatio / 100);
}

/**
 * Calculate minimum BTC required for desired mUSD amount
 * @param musdAmount - Desired mUSD amount
 * @param btcPrice - Current BTC price in USD
 * @param minRatio - Minimum collateralization ratio (default 150%)
 * @returns Minimum BTC amount required
 */
export function calculateMinBtc(
  musdAmount: string | number,
  btcPrice: number,
  minRatio: number = MIN_COLLATERAL_RATIO
): number {
  const musd = typeof musdAmount === "string" ? parseFloat(musdAmount) : musdAmount;
  const requiredCollateralValue = musd * (minRatio / 100);
  return requiredCollateralValue / btcPrice;
}

/**
 * Calculate borrowing fee based on debt amount
 * @param debtAmount - Amount of mUSD to borrow
 * @param borrowingRate - Current borrowing rate from contract (default 0.001 = 0.1%)
 * @returns Fee amount in mUSD
 */
export function calculateBorrowingFee(
  debtAmount: string | number,
  borrowingRate: number = 0.001
): number {
  const debt = typeof debtAmount === "string" ? parseFloat(debtAmount) : debtAmount;
  return debt * borrowingRate;
}

/**
 * Calculate net debt including fees and gas compensation
 * @param musdAmount - Base mUSD amount to borrow
 * @param borrowingRate - Current borrowing rate (default 0.001 = 0.1%)
 * @returns Net debt including fees and gas compensation
 */
export function calculateNetDebt(
  musdAmount: string | number,
  borrowingRate: number = 0.001
): number {
  const debt = typeof musdAmount === "string" ? parseFloat(musdAmount) : musdAmount;
  const fee = calculateBorrowingFee(debt, borrowingRate);
  const gasComp = parseFloat(MUSD_GAS_COMPENSATION);
  return debt + fee + gasComp;
}

/**
 * Validate if collateralization ratio is healthy
 * @param collRatio - Current collateralization ratio
 * @param minRatio - Minimum required ratio (default 150%)
 * @returns Object with validation status and message
 */
export function validateCollRatio(
  collRatio: number,
  minRatio: number = MIN_COLLATERAL_RATIO
): { isValid: boolean; message: string; severity: "success" | "warning" | "error" } {
  if (collRatio >= minRatio + 50) {
    return {
      isValid: true,
      message: "Excellent collateralization",
      severity: "success",
    };
  } else if (collRatio >= minRatio + 20) {
    return {
      isValid: true,
      message: "Good collateralization",
      severity: "success",
    };
  } else if (collRatio >= minRatio) {
    return {
      isValid: true,
      message: "Minimum collateralization - consider adding more collateral",
      severity: "warning",
    };
  } else if (collRatio >= CRITICAL_COLLATERAL_RATIO) {
    return {
      isValid: false,
      message: "Below minimum ratio - increase collateral or reduce debt",
      severity: "error",
    };
  } else {
    return {
      isValid: false,
      message: "Critical - position may be liquidated",
      severity: "error",
    };
  }
}

/**
 * Format BTC amount with proper decimals
 * @param amount - BTC amount
 * @param decimals - Number of decimal places (default 8)
 * @returns Formatted string
 */
export function formatBTC(amount: string | number, decimals: number = 8): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(decimals);
}

/**
 * Format USD amount with proper decimals and comma separators
 * @param amount - USD amount
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted string with $ prefix
 */
export function formatUSD(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `$${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format collateralization ratio as percentage
 * @param ratio - Collateralization ratio
 * @returns Formatted string with % suffix
 */
export function formatCollRatio(ratio: number): string {
  return `${ratio.toFixed(1)}%`;
}

/**
 * Calculate liquidation price for a position
 * @param btcAmount - Amount of BTC collateral
 * @param musdDebt - Amount of mUSD debt
 * @param liquidationRatio - Liquidation ratio (default 110%)
 * @returns BTC price at which position would be liquidated
 */
export function calculateLiquidationPrice(
  btcAmount: string | number,
  musdDebt: string | number,
  liquidationRatio: number = CRITICAL_COLLATERAL_RATIO
): number {
  const btc = typeof btcAmount === "string" ? parseFloat(btcAmount) : btcAmount;
  const debt = typeof musdDebt === "string" ? parseFloat(musdDebt) : musdDebt;

  if (btc === 0) return 0;

  return (debt * (liquidationRatio / 100)) / btc;
}

/**
 * Calculate safe BTC price drop percentage before liquidation
 * @param currentPrice - Current BTC price
 * @param liquidationPrice - Liquidation price
 * @returns Percentage drop before liquidation
 */
export function calculateSafetyBuffer(
  currentPrice: number,
  liquidationPrice: number
): number {
  if (currentPrice === 0) return 0;
  return ((currentPrice - liquidationPrice) / currentPrice) * 100;
}

/**
 * Suggest optimal mUSD amount for given BTC and target collateralization
 * @param btcAmount - Amount of BTC collateral
 * @param btcPrice - Current BTC price
 * @param targetRatio - Target collateralization ratio (default 200%)
 * @returns Suggested mUSD amount
 */
export function suggestOptimalMusd(
  btcAmount: string | number,
  btcPrice: number,
  targetRatio: number = 200
): number {
  const btc = typeof btcAmount === "string" ? parseFloat(btcAmount) : btcAmount;
  const collateralValue = btc * btcPrice;
  return collateralValue / (targetRatio / 100);
}

/**
 * Type guard to check if a value is a valid number string
 */
export function isValidNumberString(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * Calculate interest owed after a certain period
 * @param principal - Principal amount
 * @param interestRate - Annual interest rate (e.g., 0.05 for 5%)
 * @param days - Number of days
 * @returns Interest owed
 */
export function calculateInterestOwed(
  principal: number,
  interestRate: number,
  days: number
): number {
  return principal * interestRate * (days / 365);
}

// Export all constants
export const CONSTANTS = {
  MUSD_GAS_COMPENSATION,
  MIN_COLLATERAL_RATIO,
  CRITICAL_COLLATERAL_RATIO,
  DECIMALS_BTC: 18,
  DECIMALS_MUSD: 18,
  DEFAULT_BORROWING_RATE: 0.001, // 0.1%
} as const;

