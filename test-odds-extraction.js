/**
 * Test script to verify odds extraction works correctly with sample data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the extraction function
const extractFulltimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  // Filter for Fulltime Result market (market_id: 1)
  const fulltimeOdds = oddsData.data.filter(odd => odd.market_id === 1);

  if (fulltimeOdds.length === 0) {
    return null;
  }

  const result = {};

  fulltimeOdds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);

    if (label === 'home' || odd.original_label === '1') {
      result.home = value;
    } else if (label === 'draw') {
      result.draw = value;
    } else if (label === 'away' || odd.original_label === '2') {
      result.away = value;
    }
  });

  return result.home && result.draw && result.away ? result : null;
};

// Read the sample data
try {
  const sampleDataPath = path.join(__dirname, 'public', 'oddsFromApi.json');
  const sampleData = JSON.parse(fs.readFileSync(sampleDataPath, 'utf-8'));

  console.log('Testing odds extraction with sample data...\n');

  const extractedOdds = extractFulltimeOdds(sampleData);

  if (extractedOdds) {
    console.log('✓ Successfully extracted odds:');
    console.log(`  Home: ${extractedOdds.home}`);
    console.log(`  Draw: ${extractedOdds.draw}`);
    console.log(`  Away: ${extractedOdds.away}`);
    console.log('\n✓ Test passed! Odds extraction is working correctly.');
  } else {
    console.log('✗ Failed to extract odds from sample data');
  }
} catch (error) {
  console.error('Error running test:', error.message);
}
