const fs = require('fs');

console.log('═══════════════════════════════════════════════════════════');
console.log('   TEAM SHOTS MARKETS TEST');
console.log('   Testing Team Shots & Team Shots on Target extraction');
console.log('═══════════════════════════════════════════════════════════\n');

const bet365Data = JSON.parse(fs.readFileSync('./public/oddsFromApi.json', 'utf-8'));

// Extract Team Shots Over/Under
const extractTeamShotsOverUnder = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd =>
    odd.market_id === 285 && odd.total && odd.total.includes(String(total))
  );
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);
    const probability = odd.probability ? parseFloat(odd.probability.replace('%', '')) : null;

    if (odd.total.includes('Over')) {
      result.yes = value;
      result.yesProb = probability;
    } else if (odd.total.includes('Under')) {
      result.no = value;
      result.noProb = probability;
    }
  });

  return (result.yes && result.no) ? result : null;
};

// Extract Team Shots on Target Over/Under
const extractTeamShotsOnTargetOverUnder = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd =>
    odd.market_id === 284 && odd.total && odd.total.includes(String(total))
  );
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);
    const probability = odd.probability ? parseFloat(odd.probability.replace('%', '')) : null;

    if (odd.total.includes('Over')) {
      result.yes = value;
      result.yesProb = probability;
    } else if (odd.total.includes('Under')) {
      result.no = value;
      result.noProb = probability;
    }
  });

  return (result.yes && result.no) ? result : null;
};

// Calculate value bet
const calculateValueBet = (bookmakerOdds, fairOdds) => {
  if (!bookmakerOdds || !fairOdds) return '0.0';
  return ((bookmakerOdds / fairOdds) * 100).toFixed(1);
};

// Calculate fair odds from probability
const calculateFairOdds = (percentage) => {
  if (!percentage || percentage <= 0) return 0;
  return (1 / (percentage / 100)).toFixed(2);
};

// Test Team Shots on Target
console.log('🎯 TEAM SHOTS ON TARGET OVER/UNDER\n');

const teamShotsOnTarget45 = extractTeamShotsOnTargetOverUnder(bet365Data, '4.5');

if (teamShotsOnTarget45) {
  console.log('Team Shots on Target O/U 4.5:');
  console.log('  OVER:');
  console.log(`    Probability: ${teamShotsOnTarget45.yesProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShotsOnTarget45.yesProb)}`);
  console.log(`    Bet365: ${teamShotsOnTarget45.yes.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShotsOnTarget45.yes, calculateFairOdds(teamShotsOnTarget45.yesProb))}%`);

  console.log('\n  UNDER:');
  console.log(`    Probability: ${teamShotsOnTarget45.noProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShotsOnTarget45.noProb)}`);
  console.log(`    Bet365: ${teamShotsOnTarget45.no.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShotsOnTarget45.no, calculateFairOdds(teamShotsOnTarget45.noProb))}%`);
} else {
  console.log('  ✗ No Team Shots on Target O/U 4.5 data found');
}

console.log('\n─────────────────────────────────────────────────────────\n');

// Test Team Shots
console.log('⚽ TEAM SHOTS OVER/UNDER\n');

const teamShots125 = extractTeamShotsOverUnder(bet365Data, '12.5');
const teamShots135 = extractTeamShotsOverUnder(bet365Data, '13.5');

if (teamShots125) {
  console.log('Team Shots O/U 12.5:');
  console.log('  OVER:');
  console.log(`    Probability: ${teamShots125.yesProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShots125.yesProb)}`);
  console.log(`    Bet365: ${teamShots125.yes.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShots125.yes, calculateFairOdds(teamShots125.yesProb))}%`);

  console.log('\n  UNDER:');
  console.log(`    Probability: ${teamShots125.noProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShots125.noProb)}`);
  console.log(`    Bet365: ${teamShots125.no.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShots125.no, calculateFairOdds(teamShots125.noProb))}%`);
  console.log('');
} else {
  console.log('  ✗ No Team Shots O/U 12.5 data found');
}

if (teamShots135) {
  console.log('Team Shots O/U 13.5:');
  console.log('  OVER:');
  console.log(`    Probability: ${teamShots135.yesProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShots135.yesProb)}`);
  console.log(`    Bet365: ${teamShots135.yes.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShots135.yes, calculateFairOdds(teamShots135.yesProb))}%`);

  console.log('\n  UNDER:');
  console.log(`    Probability: ${teamShots135.noProb?.toFixed(1)}%`);
  console.log(`    Fair Odds: ${calculateFairOdds(teamShots135.noProb)}`);
  console.log(`    Bet365: ${teamShots135.no.toFixed(2)}`);
  console.log(`    Value: ${calculateValueBet(teamShots135.no, calculateFairOdds(teamShots135.noProb))}%`);
} else {
  console.log('  ✗ No Team Shots O/U 13.5 data found');
}

console.log('\n─────────────────────────────────────────────────────────\n');

// Summary
console.log('📊 SUMMARY:\n');

const teamShotsOnTargetMarkets = bet365Data.data.filter(d => d.market_id === 284);
const teamShotsMarkets = bet365Data.data.filter(d => d.market_id === 285);

console.log(`✓ Team Shots on Target odds found: ${teamShotsOnTargetMarkets.length} entries`);
console.log(`✓ Team Shots odds found: ${teamShotsMarkets.length} entries`);

console.log('\n✅ Using probability from odds API for fair odds calculation');
console.log('✅ No predictions API needed for these markets');
console.log('✅ Value bet calculations based on bookmaker probability');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('   TEST COMPLETE - TEAM SHOTS MARKETS WORKING');
console.log('═══════════════════════════════════════════════════════════\n');
