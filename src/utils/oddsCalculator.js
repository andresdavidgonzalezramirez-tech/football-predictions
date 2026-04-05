/**
 * Derived metrics utilities.
 * NOTE: edgePercent is internal (not an official Sportmonks field).
 */

export const calculateFairOdds = (percentage) => {
  if (!percentage || Number(percentage) <= 0) return null;
  return Number((1 / (Number(percentage) / 100)).toFixed(2));
};

export const calculateDecimalOdds = calculateFairOdds;

export const calculateValueBet = (marketOdd, fairOdd) => {
  if (!marketOdd || !fairOdd) return null;
  return Number(((Number(marketOdd) / Number(fairOdd)) * 100).toFixed(1));
};

export const calculateEdgePercent = (marketOdd, fairOdd) => {
  if (!marketOdd || !fairOdd || Number(fairOdd) === 0) return null;
  return Number((((Number(marketOdd) / Number(fairOdd)) - 1) * 100).toFixed(2));
};

export const formatPercentage = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'No disponible';
  }
  return `${Number(value).toFixed(2)}%`;
};
