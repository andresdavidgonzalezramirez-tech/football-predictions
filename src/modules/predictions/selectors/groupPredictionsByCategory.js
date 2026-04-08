export const groupPredictionsByCategory = (predictions = []) => predictions.reduce((acc, market) => {
  const key = market.category || 'Otros mercados';
  if (!acc[key]) acc[key] = [];
  acc[key].push(market);
  return acc;
}, {});
