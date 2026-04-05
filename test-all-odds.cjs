const fs = require('fs');

// Import extraction functions (duplicated for testing)
const extractFulltimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) return null;
  const fulltimeOdds = oddsData.data.filter(odd => odd.market_id === 1);
  if (fulltimeOdds.length === 0) return null;

  const result = {};
  fulltimeOdds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);
    if (label === 'home' || odd.original_label === '1') result.home = value;
    else if (label === 'draw') result.draw = value;
    else if (label === 'away' || odd.original_label === '2') result.away = value;
  });
  return result.home && result.draw && result.away ? result : null;
};

const extractHalfTimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) return null;
  const odds = oddsData.data.filter(odd => odd.market_id === 31);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);
    if (label === 'home' || odd.original_label === '1') result.home = value;
    else if (label === 'draw') result.draw = value;
    else if (label === 'away' || odd.original_label === '2') result.away = value;
  });
  return result.home && result.draw && result.away ? result : null;
};

const extractDoubleChanceOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) return null;
  const odds = oddsData.data.filter(odd => odd.market_id === 2);
  if (odds.length < 3) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);
    // Use sort_order to determine the type
    if (odd.sort_order === 0) result.draw_home = value;      // Home or Draw
    else if (odd.sort_order === 1) result.draw_away = value; // Draw or Away
    else if (odd.sort_order === 2) result.home_away = value; // Home or Away
  });
  return result.draw_home && result.home_away && result.draw_away ? result : null;
};

const extractOverUnderOdds = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) return null;
  const odds = oddsData.data.filter(odd => odd.market_id === 80 && odd.total === String(total));
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);
    if (label === 'over') result.yes = value;
    else if (label === 'under') result.no = value;
  });
  return result.yes && result.no ? result : null;
};

const extractBothTeamsToScoreOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) return null;
  const odds = oddsData.data.filter(odd => odd.market_id === 14);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);
    if (label === 'yes') result.yes = value;
    else if (label === 'no') result.no = value;
  });
  return result.yes && result.no ? result : null;
};

const calculateValueBet = (bookmakerOdds, fairOdds) => {
  if (!bookmakerOdds || !fairOdds || fairOdds === 0) return 0;
  return ((bookmakerOdds / fairOdds) * 100).toFixed(1);
};

// Run tests
console.log('=== TESTING ALL ODDS EXTRACTION FUNCTIONS ===\n');

const sampleData = JSON.parse(fs.readFileSync('./public/oddsFromApi.json', 'utf-8'));

// Test Fulltime Result
console.log('1. FULLTIME RESULT:');
const fulltime = extractFulltimeOdds(sampleData);
if (fulltime) {
  console.log('   ✓ Home:', fulltime.home);
  console.log('   ✓ Draw:', fulltime.draw);
  console.log('   ✓ Away:', fulltime.away);
} else {
  console.log('   ✗ Failed to extract');
}

// Test Half Time Result
console.log('\n2. HALF TIME RESULT:');
const halftime = extractHalfTimeOdds(sampleData);
if (halftime) {
  console.log('   ✓ Home:', halftime.home);
  console.log('   ✓ Draw:', halftime.draw);
  console.log('   ✓ Away:', halftime.away);
} else {
  console.log('   ✗ Failed to extract');
}

// Test Double Chance
console.log('\n3. DOUBLE CHANCE:');
const doubleChance = extractDoubleChanceOdds(sampleData);
if (doubleChance) {
  console.log('   ✓ Home or Draw:', doubleChance.draw_home);
  console.log('   ✓ Home or Away:', doubleChance.home_away);
  console.log('   ✓ Draw or Away:', doubleChance.draw_away);
} else {
  console.log('   ✗ Failed to extract');
}

// Test Over/Under
console.log('\n4. OVER/UNDER:');
['1.5', '2.5', '3.5', '4.5'].forEach(total => {
  const ou = extractOverUnderOdds(sampleData, total);
  if (ou) {
    console.log(`   ✓ ${total}: Over ${ou.yes}, Under ${ou.no}`);
  } else {
    console.log(`   - ${total}: Not available`);
  }
});

// Test Both Teams To Score
console.log('\n5. BOTH TEAMS TO SCORE:');
const btts = extractBothTeamsToScoreOdds(sampleData);
if (btts) {
  console.log('   ✓ Yes:', btts.yes);
  console.log('   ✓ No:', btts.no);
} else {
  console.log('   ✗ Failed to extract');
}

// Test Value Bet Calculation
console.log('\n6. VALUE BET CALCULATION:');
console.log('   Example: Bookmaker 2.60, Fair 2.50');
console.log('   Value:', calculateValueBet(2.60, 2.50) + '%');
console.log('   (Values > 100% indicate a value bet)');

console.log('\n=== ALL TESTS COMPLETED ===');
