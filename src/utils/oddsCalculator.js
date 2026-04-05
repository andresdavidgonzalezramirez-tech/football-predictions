/**
 * Calculates decimal fair odds from prediction percentage
 * Formula: odds = 1 / (percentage / 100)
 *
 * @param {number} percentage - Prediction percentage (0-100)
 * @returns {number} Decimal odds rounded to 2 decimal places
 *
 * @example
 * calculateFairOdds(50) // returns 2.00 (50% chance = 2.00 odds)
 * calculateFairOdds(25) // returns 4.00 (25% chance = 4.00 odds)
 */
export const calculateFairOdds = (percentage) => {
  if (!percentage || percentage <= 0) return 0;
  return (1 / (percentage / 100)).toFixed(2);
};

/**
 * Formats percentage for display
 * @param {number} percentage - Raw percentage value
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage) => {
  if (!percentage) return '0%';
  return `${percentage.toFixed(1)}%`;
};

/**
 * Determines color based on percentage (for styling)
 * @param {number} percentage - Prediction percentage
 * @returns {string} Color class or value
 */
export const getPercentageColor = (percentage) => {
  if (percentage >= 60) return 'high'; // High probability
  if (percentage >= 40) return 'medium'; // Medium probability
  return 'low'; // Low probability
};

// Alias for backwards compatibility
export const calculateDecimalOdds = calculateFairOdds;

/**
 * Calculate value bet percentage
 * Formula: (bookmaker odds / fair odds) * 100
 * Values > 100 indicate a value bet (bookmaker odds are better than fair odds)
 *
 * @param {number} bookmakerOdds - Odds from bookmaker
 * @param {number} fairOdds - Fair odds calculated from probability
 * @returns {number} Value bet percentage
 */
export const calculateValueBet = (bookmakerOdds, fairOdds) => {
  if (!bookmakerOdds || !fairOdds || fairOdds === 0) return 0;
  return ((bookmakerOdds / fairOdds) * 100).toFixed(1);
};

/**
 * Extracts Fulltime Result odds from bookmaker API response
 * @param {object} oddsData - API response data containing odds array
 * @returns {object} Object with home, draw, away odds or null
 */
export const extractFulltimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const fulltimeOdds = oddsData.data.filter(odd => odd.market_id === 1);
  if (fulltimeOdds.length === 0) return null;

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

/**
 * Extracts Half Time Result odds (market_id: 31)
 */
export const extractHalfTimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 31);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
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

/**
 * Extracts Double Chance odds (market_id: 2)
 * Uses sort_order to determine position (0=home/draw, 1=draw/away, 2=home/away)
 */
export const extractDoubleChanceOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 2);
  if (odds.length < 3) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);

    // Use sort_order to determine the type
    if (odd.sort_order === 0) {
      result.draw_home = value;  // Home or Draw
    } else if (odd.sort_order === 1) {
      result.draw_away = value;  // Draw or Away
    } else if (odd.sort_order === 2) {
      result.home_away = value;  // Home or Away
    }
  });

  return result.draw_home && result.home_away && result.draw_away ? result : null;
};

/**
 * Extracts Half Time/Full Time odds (market_id: 29)
 */
export const extractHalfTimeFullTimeOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 29);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);

    // Parse labels like "Home - Home", "Home - Draw", etc.
    if (label.includes('home') && label.includes('home')) result.home_home = value;
    else if (label.includes('home') && label.includes('draw')) result.home_draw = value;
    else if (label.includes('home') && label.includes('away')) result.home_away = value;
    else if (label.includes('draw') && label.includes('home')) result.draw_home = value;
    else if (label.includes('draw') && label.includes('draw')) result.draw_draw = value;
    else if (label.includes('draw') && label.includes('away')) result.draw_away = value;
    else if (label.includes('away') && label.includes('home')) result.away_home = value;
    else if (label.includes('away') && label.includes('draw')) result.away_draw = value;
    else if (label.includes('away') && label.includes('away')) result.away_away = value;
  });

  return Object.keys(result).length === 9 ? result : null;
};

/**
 * Extracts Over/Under odds (market_id: 80)
 * @param {string} total - The total line (e.g., "1.5", "2.5", "3.5")
 */
export const extractOverUnderOdds = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd =>
    odd.market_id === 80 && odd.total === String(total)
  );
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);

    if (label === 'over') {
      result.yes = value;  // Match prediction format
    } else if (label === 'under') {
      result.no = value;   // Match prediction format
    }
  });

  return result.yes && result.no ? result : null;
};

/**
 * Extracts Both Teams to Score odds (market_id: 14)
 */
export const extractBothTeamsToScoreOdds = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 14);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const label = odd.label?.toLowerCase();
    const value = parseFloat(odd.value);

    if (label === 'yes') {
      result.yes = value;
    } else if (label === 'no') {
      result.no = value;
    }
  });

  return result.yes && result.no ? result : null;
};

/**
 * Extracts Corner Over/Under odds
 * Supports multiple markets based on market_description
 * - "Corners" (Market ID 67): Over/Under with specific total
 * - "Corners 2-Way" (Market ID 60): Asian style Over/Under
 * - "Asian Total Corners" (Market ID 61): Asian Total
 */
export const extractCornersOverUnder = (oddsData, total) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  // Try multiple market IDs and total formats
  const marketIds = [67, 60, 61]; // Corners, Corners 2-Way, Asian Total Corners
  const totalVariations = [String(total), String(parseFloat(total))];

  let odds = [];

  // Try to find matching odds
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

/**
 * Extracts Corner Match Bet odds (Market ID 71)
 * Which team will get more corners
 */
export const extractCornerMatchBet = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 71);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);

    // Use sort_order: 0=home, 1=tie, 2=away
    if (odd.sort_order === 0) {
      result.home = value;
    } else if (odd.sort_order === 1) {
      result.tie = value;
    } else if (odd.sort_order === 2) {
      result.away = value;
    }
  });

  return result.home && result.away ? result : null;
};

/**
 * Extracts Corners 1x2 odds (Market ID 269) - Unibet specific
 * Which team gets more corners (includes tie)
 */
export const extractCorners1x2 = (oddsData) => {
  if (!oddsData || !oddsData.data || !Array.isArray(oddsData.data)) {
    return null;
  }

  const odds = oddsData.data.filter(odd => odd.market_id === 269);
  if (odds.length === 0) return null;

  const result = {};
  odds.forEach(odd => {
    const value = parseFloat(odd.value);
    const label = odd.label?.toLowerCase();

    // Use sort_order: 1=home, 2=draw, 3=away
    if (odd.sort_order === 1 || label === 'home') {
      result.home = value;
    } else if (odd.sort_order === 2 || label === 'draw') {
      result.tie = value;
    } else if (odd.sort_order === 3 || label === 'away') {
      result.away = value;
    }
  });

  return result.home && result.away ? result : null;
};

/**
 * Extracts Team Shots Over/Under odds (Market ID 285)
 * @param {string} total - The total line (e.g., "12.5", "13.5")
 */
export const extractTeamShotsOverUnder = (oddsData, total) => {
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

/**
 * Extracts Team Shots on Target Over/Under odds (Market ID 284)
 * @param {string} total - The total line (e.g., "4.5")
 */
export const extractTeamShotsOnTargetOverUnder = (oddsData, total) => {
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

/**
 * Extracts all available bookmaker odds organized by market type
 * Can handle single bookmaker or merged data from multiple bookmakers
 */
export const extractAllOdds = (oddsData) => {
  // Extended corner totals to support Unibet's wider range
  const cornerTotals = ['4', '5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15', '15.5'];

  const cornersData = {};
  cornerTotals.forEach(total => {
    const odds = extractCornersOverUnder(oddsData, total);
    if (odds) {
      cornersData[total] = odds;
    }
  });

  // Extended goal totals
  const goalTotals = ['0.5', '1.5', '2.5', '3.5', '4.5'];
  const overUnderData = {};
  goalTotals.forEach(total => {
    const odds = extractOverUnderOdds(oddsData, total);
    if (odds) {
      overUnderData[total] = odds;
    }
  });

  // Team Shots totals
  const teamShotsTotals = ['12.5', '13.5'];
  const teamShotsData = {};
  teamShotsTotals.forEach(total => {
    const odds = extractTeamShotsOverUnder(oddsData, total);
    if (odds) {
      teamShotsData[total] = odds;
    }
  });

  // Team Shots on Target totals
  const teamShotsOnTargetTotals = ['4.5'];
  const teamShotsOnTargetData = {};
  teamShotsOnTargetTotals.forEach(total => {
    const odds = extractTeamShotsOnTargetOverUnder(oddsData, total);
    if (odds) {
      teamShotsOnTargetData[total] = odds;
    }
  });

  return {
    fulltime: extractFulltimeOdds(oddsData),
    halftime: extractHalfTimeOdds(oddsData),
    doubleChance: extractDoubleChanceOdds(oddsData),
    htft: extractHalfTimeFullTimeOdds(oddsData),
    overUnder: overUnderData,
    btts: extractBothTeamsToScoreOdds(oddsData),
    corners: cornersData,
    cornerMatchBet: extractCornerMatchBet(oddsData),
    corners1x2: extractCorners1x2(oddsData), // Unibet specific
    teamShots: teamShotsData,
    teamShotsOnTarget: teamShotsOnTargetData,
  };
};
