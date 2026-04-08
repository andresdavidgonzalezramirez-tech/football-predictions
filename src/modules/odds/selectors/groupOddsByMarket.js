export const groupOddsByMarket = (odds = []) => odds.reduce((acc, row) => {
  const key = row.marketDescription || row.marketName || 'Mercado';
  if (!acc[key]) acc[key] = [];
  acc[key].push(row);
  return acc;
}, {});
