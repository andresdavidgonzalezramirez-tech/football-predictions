const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/oddsFromApi.json', 'utf-8'));

// Get samples of each market type
const samples = {};
data.data.forEach(d => {
  if (!samples[d.market_id]) {
    samples[d.market_id] = {
      market: d.market?.developer_name,
      label: d.label,
      original_label: d.original_label,
      value: d.value,
      total: d.total,
      handicap: d.handicap,
      market_description: d.market_description
    };
  }
});

console.log('Market samples:\n');
Object.keys(samples).sort((a, b) => a - b).slice(0, 20).forEach(marketId => {
  const sample = samples[marketId];
  console.log(`Market ID ${marketId}: ${sample.market}`);
  console.log(`  Label: ${sample.label}, Original: ${sample.original_label}`);
  console.log(`  Value: ${sample.value}, Total: ${sample.total}, Handicap: ${sample.handicap}`);
  console.log('');
});

// Show specific markets we care about
console.log('\n=== KEY MARKETS FOR IMPLEMENTATION ===\n');

// Fulltime Result
const ftResult = data.data.filter(d => d.market_id === 1);
console.log('1. FULLTIME_RESULT:');
ftResult.forEach(d => console.log(`   ${d.label} (${d.original_label}): ${d.value}`));

// Both Teams to Score
const btts = data.data.filter(d => d.market_id === 14);
console.log('\n14. BOTH_TEAMS_TO_SCORE:');
btts.forEach(d => console.log(`   ${d.label}: ${d.value}`));

// Over/Under
const ou = data.data.filter(d => d.market_id === 80 && d.total === '2.5');
console.log('\n80. GOALS_OVER_UNDER (2.5):');
ou.forEach(d => console.log(`   ${d.label}: ${d.value}`));

// Half Time Result
const ht = data.data.filter(d => d.market_id === 31);
console.log('\n31. HALF_TIME_RESULT:');
ht.forEach(d => console.log(`   ${d.label} (${d.original_label}): ${d.value}`));

// Double Chance
const dc = data.data.filter(d => d.market_id === 2);
console.log('\n2. DOUBLE_CHANCE:');
dc.forEach(d => console.log(`   ${d.label} (${d.original_label}): ${d.value}`));
