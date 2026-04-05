const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/oddsFromApi.json', 'utf-8'));

// Get all corner markets
const corners = data.data.filter(d =>
  d.market_description && d.market_description.toLowerCase().includes('corner')
);

console.log('=== CORNER MARKETS ANALYSIS ===\n');

// Group by market description
const grouped = {};
corners.forEach(d => {
  const desc = d.market_description;
  if (!grouped[desc]) {
    grouped[desc] = {
      market_id: d.market_id,
      developer_name: d.market?.developer_name,
      count: 0,
      samples: []
    };
  }
  grouped[desc].count++;
  if (grouped[desc].samples.length < 3) {
    grouped[desc].samples.push({
      label: d.label,
      value: d.value,
      total: d.total,
      handicap: d.handicap,
      sort_order: d.sort_order
    });
  }
});

// Display results
Object.keys(grouped).sort().forEach(desc => {
  const info = grouped[desc];
  console.log(`\n${desc}`);
  console.log(`  Market ID: ${info.market_id}`);
  console.log(`  Developer Name: ${info.developer_name}`);
  console.log(`  Total odds: ${info.count}`);
  console.log('  Samples:');
  info.samples.forEach(s => {
    console.log(`    - ${s.label}: ${s.value} (total: ${s.total}, handicap: ${s.handicap}, sort: ${s.sort_order})`);
  });
});

// Also show what the prediction codes look like for corners
console.log('\n\n=== CHECKING PREDICTION CODES FOR CORNERS ===\n');
console.log('Looking for prediction types that might match corner markets...');
