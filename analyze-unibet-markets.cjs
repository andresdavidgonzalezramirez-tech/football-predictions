const fs = require('fs');
const unibetData = JSON.parse(fs.readFileSync('./public/oddsFromApiUnibet.json', 'utf-8'));

console.log('═══════════════════════════════════════════════════════════');
console.log('   UNIBET ODDS ANALYSIS (Bookmaker ID: 23)');
console.log('═══════════════════════════════════════════════════════════\n');

// Get all unique market descriptions
const descriptions = [...new Set(unibetData.data.map(d => d.market_description))];
console.log(`Total unique markets: ${descriptions.length}\n`);

console.log('AVAILABLE MARKETS:\n');
descriptions.sort().forEach((desc, i) => {
  console.log(`${(i + 1).toString().padStart(2)}. ${desc}`);
});

console.log('\n─────────────────────────────────────────────────────────\n');

// Group by market ID and description
const marketInfo = {};
unibetData.data.forEach(d => {
  const key = `${d.market_id}|${d.market_description}`;
  if (!marketInfo[key]) {
    marketInfo[key] = {
      market_id: d.market_id,
      description: d.market_description,
      developer_name: d.market?.developer_name,
      count: 0,
      samples: []
    };
  }
  marketInfo[key].count++;
  if (marketInfo[key].samples.length < 3) {
    marketInfo[key].samples.push({
      label: d.label,
      value: d.value,
      total: d.total,
      handicap: d.handicap,
      sort_order: d.sort_order
    });
  }
});

console.log('DETAILED MARKET BREAKDOWN:\n');
Object.values(marketInfo).sort((a, b) => a.market_id - b.market_id).forEach(info => {
  console.log(`Market ID ${info.market_id}: ${info.description}`);
  console.log(`  Developer Name: ${info.developer_name}`);
  console.log(`  Total odds: ${info.count}`);
  console.log('  Sample odds:');
  info.samples.forEach(s => {
    const details = [];
    if (s.total !== null) details.push(`total: ${s.total}`);
    if (s.handicap !== null) details.push(`handicap: ${s.handicap}`);
    if (s.sort_order !== null) details.push(`sort: ${s.sort_order}`);
    const detailStr = details.length > 0 ? ` (${details.join(', ')})` : '';
    console.log(`    ${s.label}: ${s.value}${detailStr}`);
  });
  console.log('');
});

// Compare with Bet365 (from the other file)
console.log('─────────────────────────────────────────────────────────\n');
console.log('CORNER MARKETS ANALYSIS:\n');

const cornerMarkets = unibetData.data.filter(d =>
  d.market_description && d.market_description.toLowerCase().includes('corner')
);

const cornersByMarket = {};
cornerMarkets.forEach(d => {
  const key = `${d.market_id}|${d.market_description}`;
  if (!cornersByMarket[key]) {
    cornersByMarket[key] = {
      market_id: d.market_id,
      description: d.market_description,
      odds: []
    };
  }
  cornersByMarket[key].odds.push({
    label: d.label,
    value: d.value,
    total: d.total,
    handicap: d.handicap
  });
});

Object.values(cornersByMarket).forEach(market => {
  console.log(`Market ID ${market.market_id}: ${market.description}`);
  console.log(`  Total odds: ${market.odds.length}`);

  // Group by total for O/U markets
  const byTotal = {};
  market.odds.forEach(odd => {
    const total = odd.total || 'N/A';
    if (!byTotal[total]) byTotal[total] = [];
    byTotal[total].push(odd);
  });

  Object.keys(byTotal).sort().forEach(total => {
    if (total !== 'N/A') {
      console.log(`  Total ${total}:`);
      byTotal[total].forEach(odd => {
        console.log(`    ${odd.label}: ${odd.value}`);
      });
    }
  });
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════\n');
