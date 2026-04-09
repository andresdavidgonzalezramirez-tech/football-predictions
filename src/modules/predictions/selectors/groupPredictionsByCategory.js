const safeArray = (value) => (Array.isArray(value) ? value : []);

export const groupPredictionsByCategory = (predictions = []) => safeArray(predictions).reduce((acc, market) => {
  const key = market.category || 'Otros mercados';
  if (!acc[key]) acc[key] = [];
  acc[key].push(market);
  return acc;
}, {});
