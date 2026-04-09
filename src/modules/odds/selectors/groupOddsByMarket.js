const safeArray = (value) => (Array.isArray(value) ? value : []);

export const groupOddsByMarket = (odds = []) => safeArray(odds).reduce((acc, row) => {
  const key = row.marketDescription || row.marketName || 'Mercado';
  if (!acc[key]) acc[key] = [];
  acc[key].push(row);
  return acc;
}, {});
