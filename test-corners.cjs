const fs = require('fs');
const sampleData = JSON.parse(fs.readFileSync('./public/oddsFromApi.json', 'utf-8'));

// Corner extraction function
const extractCornersOverUnder = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const marketIds = [67, 60, 61]; // Corners, Corners 2-Way, Asian Total Corners
  const totalVariations = [String(total), String(parseFloat(total))];

  let odds = [];

  for (const marketId of marketIds) {
    for (const totalVar of totalVariations) {
      const found = oddsData.data.filter(odd =>
        odd.market_id === marketId &&
        (odd.total === totalVar || odd.total === total)
      );
      if (found.length > 0) {
        odds = found;
        break;
      }
    }
    if (odds.length > 0) break;
  }

  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);

    if (label === 'over') {
      result.yes = value;
    } else if (label === 'under') {
      result.no = value;
    } else if (label === 'exactly') {
      result.equal = value;
    }
  });

  return (result.yes && result.no) ? result : null;
};

// Corner Match Bet extraction
const extractCornerMatchBet = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 71);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);
    if (odd.sort_order === 0) result.home = value;
    else if (odd.sort_order === 1) result.tie = value;
    else if (odd.sort_order === 2) result.away = value;
  });

  return result.home && result.away ? result : null;
};

// Value bet calculation
const calculateValueBet = (bookmakerOdds, fairOdds) => {
  if (!bookmakerOdds || !fairOdds || fairOdds === 0) return 0;
  return ((bookmakerOdds / fairOdds) * 100).toFixed(1);
};

console.log('=== TESTING CORNER ODDS EXTRACTION ===\n');

// Test various corner totals
const totals = ['4', '5', '6', '7', '8', '9', '10', '10.5', '11'];

console.log('CORNER OVER/UNDER MARKETS:\n');
totals.forEach(total => {
  const result = extractCornersOverUnder(sampleData, total);
  if (result) {
    console.log(`Corners O/U ${total}:`);
    console.log(`  ✓ Over: ${result.yes}`);
    console.log(`  ✓ Under: ${result.no}`);
    if (result.equal) {
      console.log(`  ✓ Exactly: ${result.equal}`);
    }

    // Example value bet calculation
    const fairOddsOver = 2.00; // Example
    const valueBet = calculateValueBet(result.yes, fairOddsOver);
    console.log(`  Example Value Bet: ${valueBet}% (if fair odds were 2.00)`);
    console.log('');
  } else {
    console.log(`Corners O/U ${total}: Not available`);
  }
});

// Test corner match bet
console.log('\nCORNER MATCH BET:\n');
const cornerMatchBet = extractCornerMatchBet(sampleData);
if (cornerMatchBet) {
  console.log('✓ Corner Match Bet extracted:');
  console.log(`  Home: ${cornerMatchBet.home}`);
  console.log(`  Tie: ${cornerMatchBet.tie}`);
  console.log(`  Away: ${cornerMatchBet.away}`);
} else {
  console.log('✗ Corner Match Bet: Not available');
}

console.log('\n=== CORNER ODDS TEST COMPLETED ===');
