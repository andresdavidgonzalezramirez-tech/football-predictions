import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFixtureDetails, getBookmakerOdds } from '../services/sportsmonksApi';
import { calculateDecimalOdds, extractAllOdds, calculateValueBet } from '../utils/oddsCalculator';
import './MatchDetails.css';

/**
 * MatchDetails Component
 * Displays detailed match information with ALL predictions
 */
const MatchDetails = () => {
  const { fixtureId } = useParams();
  const navigate = useNavigate();
  const [fixture, setFixture] = useState(null);
  const [bet365Odds, setBet365Odds] = useState(null);
  const [unibetOdds, setUnibetOdds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fulltime');
  const [showOnlyValueBets, setShowOnlyValueBets] = useState(false);
  const [minValueThreshold, setMinValueThreshold] = useState(100);

  useEffect(() => {
    fetchFixtureDetails();
    fetchAllBookmakerOdds();
  }, [fixtureId]);

  const fetchFixtureDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFixtureDetails(fixtureId);
      setFixture(data.data);
    } catch (err) {
      setError('Failed to load fixture details');
      console.error('Error fetching fixture:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBookmakerOdds = async () => {
    try {
      // Fetch both Bet365 and Unibet odds in parallel
      const [bet365Data, unibetData] = await Promise.all([
        getBookmakerOdds(fixtureId, 2).catch(err => {
          console.error('Error fetching Bet365 odds:', err);
          return null;
        }),
        getBookmakerOdds(fixtureId, 23).catch(err => {
          console.error('Error fetching Unibet odds:', err);
          return null;
        })
      ]);

      if (bet365Data) {
        const bet365Extracted = extractAllOdds(bet365Data);
        setBet365Odds(bet365Extracted);
      }

      if (unibetData) {
        const unibetExtracted = extractAllOdds(unibetData);
        setUnibetOdds(unibetExtracted);
      }
    } catch (err) {
      console.error('Error fetching bookmaker odds:', err);
      // Don't set error state here, just log it - odds are optional
    }
  };

  const getPredictionByType = (code) => {
    return fixture?.predictions?.find(p => p.type?.code === code);
  };

  // Helper to count value bets across all markets
  const countValueBets = () => {
    let count = 0;
    const threshold = minValueThreshold;

    // Count from all available odds
    if (bet365Odds) {
      // Fulltime
      if (bet365Odds.fulltime) {
        const pred = getPredictionByType('winner');
        if (pred) {
          const { home, draw, away } = pred.predictions;
          if (bet365Odds.fulltime.home && calculateValueBet(bet365Odds.fulltime.home, calculateDecimalOdds(home)) >= threshold) count++;
          if (bet365Odds.fulltime.draw && calculateValueBet(bet365Odds.fulltime.draw, calculateDecimalOdds(draw)) >= threshold) count++;
          if (bet365Odds.fulltime.away && calculateValueBet(bet365Odds.fulltime.away, calculateDecimalOdds(away)) >= threshold) count++;
        }
      }
      // BTTS
      if (bet365Odds.btts) {
        const pred = getPredictionByType('both-teams-to-score-probability');
        if (pred) {
          const { yes, no } = pred.predictions;
          if (bet365Odds.btts.yes && calculateValueBet(bet365Odds.btts.yes, calculateDecimalOdds(yes)) >= threshold) count++;
          if (bet365Odds.btts.no && calculateValueBet(bet365Odds.btts.no, calculateDecimalOdds(no)) >= threshold) count++;
        }
      }
      // Team Shots
      if (bet365Odds.teamShots) {
        Object.keys(bet365Odds.teamShots).forEach(total => {
          const odds = bet365Odds.teamShots[total];
          if (odds.yesProb && calculateValueBet(odds.yes, calculateDecimalOdds(odds.yesProb)) >= threshold) count++;
          if (odds.noProb && calculateValueBet(odds.no, calculateDecimalOdds(odds.noProb)) >= threshold) count++;
        });
      }
      // Team Shots on Target
      if (bet365Odds.teamShotsOnTarget) {
        Object.keys(bet365Odds.teamShotsOnTarget).forEach(total => {
          const odds = bet365Odds.teamShotsOnTarget[total];
          if (odds.yesProb && calculateValueBet(odds.yes, calculateDecimalOdds(odds.yesProb)) >= threshold) count++;
          if (odds.noProb && calculateValueBet(odds.no, calculateDecimalOdds(odds.noProb)) >= threshold) count++;
        });
      }
    }

    if (unibetOdds) {
      // Similar checks for Unibet
      if (unibetOdds.fulltime) {
        const pred = getPredictionByType('winner');
        if (pred) {
          const { home, draw, away } = pred.predictions;
          if (unibetOdds.fulltime.home && calculateValueBet(unibetOdds.fulltime.home, calculateDecimalOdds(home)) >= threshold) count++;
          if (unibetOdds.fulltime.draw && calculateValueBet(unibetOdds.fulltime.draw, calculateDecimalOdds(draw)) >= threshold) count++;
          if (unibetOdds.fulltime.away && calculateValueBet(unibetOdds.fulltime.away, calculateDecimalOdds(away)) >= threshold) count++;
        }
      }
      if (unibetOdds.btts) {
        const pred = getPredictionByType('both-teams-to-score-probability');
        if (pred) {
          const { yes, no } = pred.predictions;
          if (unibetOdds.btts.yes && calculateValueBet(unibetOdds.btts.yes, calculateDecimalOdds(yes)) >= threshold) count++;
          if (unibetOdds.btts.no && calculateValueBet(unibetOdds.btts.no, calculateDecimalOdds(no)) >= threshold) count++;
        }
      }
    }

    return count;
  };

  // Helper to render bookmaker odds for both Bet365 and Unibet
  const renderBookmakerOdds = (bet365Value, unibetValue, fairOdds) => {
    const bet365ValuePct = bet365Value ? parseFloat(calculateValueBet(bet365Value, fairOdds)) : 0;
    const unibetValuePct = unibetValue ? parseFloat(calculateValueBet(unibetValue, fairOdds)) : 0;
    const isValueBet365 = bet365ValuePct >= minValueThreshold;
    const isValueUnibet = unibetValuePct >= minValueThreshold;

    // Filter based on showOnlyValueBets setting
    if (showOnlyValueBets && !isValueBet365 && !isValueUnibet) {
      return null;
    }

    return (
      <>
        {bet365Value && (!showOnlyValueBets || isValueBet365) && (
          <>
            <div className={`bookmaker-odds bet365 ${isValueBet365 ? 'value-highlight' : ''}`}>
              Bet365: {bet365Value.toFixed(2)}
              {isValueBet365 && <span className="value-badge">⭐ VALUE</span>}
            </div>
            <div className={`value-bet ${isValueBet365 ? 'is-value' : ''}`}>Value: {bet365ValuePct.toFixed(1)}%</div>
          </>
        )}
        {unibetValue && (!showOnlyValueBets || isValueUnibet) && (
          <>
            <div className={`bookmaker-odds unibet ${isValueUnibet ? 'value-highlight' : ''}`}>
              Unibet: {unibetValue.toFixed(2)}
              {isValueUnibet && <span className="value-badge">⭐ VALUE</span>}
            </div>
            <div className={`value-bet ${isValueUnibet ? 'is-value' : ''}`}>Value: {unibetValuePct.toFixed(1)}%</div>
          </>
        )}
      </>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderFulltimeResult = () => {
    const pred = getPredictionByType('fulltime-result-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { home, draw, away } = pred.predictions;

    const fairOddsHome = calculateDecimalOdds(home);
    const fairOddsDraw = calculateDecimalOdds(draw);
    const fairOddsAway = calculateDecimalOdds(away);

    return (
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-label">Home Win</div>
          <div className="prediction-percentage">{home?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsHome}</div>
          {renderBookmakerOdds(bet365Odds?.fulltime?.home, unibetOdds?.fulltime?.home, fairOddsHome)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Draw</div>
          <div className="prediction-percentage">{draw?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsDraw}</div>
          {renderBookmakerOdds(bet365Odds?.fulltime?.draw, unibetOdds?.fulltime?.draw, fairOddsDraw)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Away Win</div>
          <div className="prediction-percentage">{away?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsAway}</div>
          {renderBookmakerOdds(bet365Odds?.fulltime?.away, unibetOdds?.fulltime?.away, fairOddsAway)}
        </div>
      </div>
    );
  };

  const renderFirstHalfWinner = () => {
    const pred = getPredictionByType('first-half-winner');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { home, draw, away } = pred.predictions;

    const fairOddsHome = calculateDecimalOdds(home);
    const fairOddsDraw = calculateDecimalOdds(draw);
    const fairOddsAway = calculateDecimalOdds(away);

    return (
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-label">Home Win (HT)</div>
          <div className="prediction-percentage">{home?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsHome}</div>
          {renderBookmakerOdds(bet365Odds?.halftime?.home, unibetOdds?.halftime?.home, fairOddsHome)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Draw (HT)</div>
          <div className="prediction-percentage">{draw?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsDraw}</div>
          {renderBookmakerOdds(bet365Odds?.halftime?.draw, unibetOdds?.halftime?.draw, fairOddsDraw)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Away Win (HT)</div>
          <div className="prediction-percentage">{away?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsAway}</div>
          {renderBookmakerOdds(bet365Odds?.halftime?.away, unibetOdds?.halftime?.away, fairOddsAway)}
        </div>
      </div>
    );
  };

  const renderDoubleChance = () => {
    const pred = getPredictionByType('double_chance-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { draw_home, home_away, draw_away } = pred.predictions;

    const fairOddsDrawHome = calculateDecimalOdds(draw_home);
    const fairOddsHomeAway = calculateDecimalOdds(home_away);
    const fairOddsDrawAway = calculateDecimalOdds(draw_away);

    return (
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-label">Home or Draw</div>
          <div className="prediction-percentage">{draw_home?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsDrawHome}</div>
          {renderBookmakerOdds(bet365Odds?.doubleChance?.draw_home, unibetOdds?.doubleChance?.draw_home, fairOddsDrawHome)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Home or Away</div>
          <div className="prediction-percentage">{home_away?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsHomeAway}</div>
          {renderBookmakerOdds(bet365Odds?.doubleChance?.home_away, unibetOdds?.doubleChance?.home_away, fairOddsHomeAway)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Draw or Away</div>
          <div className="prediction-percentage">{draw_away?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsDrawAway}</div>
          {renderBookmakerOdds(bet365Odds?.doubleChance?.draw_away, unibetOdds?.doubleChance?.draw_away, fairOddsDrawAway)}
        </div>
      </div>
    );
  };

  const renderHalfTimeFullTime = () => {
    const pred = getPredictionByType('half-time-full-time-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { home_home, home_draw, home_away, draw_home, draw_draw, draw_away, away_home, away_draw, away_away } = pred.predictions;

    return (
      <div className="htft-container">
        <div className="htft-label-row">HT / FT</div>
        <div className="htft-grid">
          <div className="htft-header">
            <div></div>
            <div className="htft-label">Home</div>
            <div className="htft-label">Draw</div>
            <div className="htft-label">Away</div>
          </div>
          <div className="htft-row">
            <div className="htft-label">Home</div>
            <div className="htft-cell">
              <div className="htft-percentage">{home_home?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(home_home)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{home_draw?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(home_draw)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{home_away?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(home_away)}</div>
            </div>
          </div>
          <div className="htft-row">
            <div className="htft-label">Draw</div>
            <div className="htft-cell">
              <div className="htft-percentage">{draw_home?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(draw_home)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{draw_draw?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(draw_draw)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{draw_away?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(draw_away)}</div>
            </div>
          </div>
          <div className="htft-row">
            <div className="htft-label">Away</div>
            <div className="htft-cell">
              <div className="htft-percentage">{away_home?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(away_home)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{away_draw?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(away_draw)}</div>
            </div>
            <div className="htft-cell">
              <div className="htft-percentage">{away_away?.toFixed(2)}%</div>
              <div className="htft-odds">{calculateDecimalOdds(away_away)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverUnder = () => {
    const predictions = [
      { codes: ['over-under-1_5-probability', 'over-under-1_5_probability'], label: 'Over/Under 1.5', total: '1.5' },
      { codes: ['over-under-2_5-probability', 'over-under-2_5_probability'], label: 'Over/Under 2.5', total: '2.5' },
      { codes: ['over-under-3_5-probability', 'over-under-3_5_probability'], label: 'Over/Under 3.5', total: '3.5' },
      { codes: ['over-under-4_5-probability', 'over-under-4_5_probability'], label: 'Over/Under 4.5', total: '4.5' }
    ];

    const hasAnyData = predictions.some(({ codes }) =>
      codes.some(code => getPredictionByType(code))
    );
    if (!hasAnyData) return <div className="no-data">No prediction data available</div>;

    return (
      <div className="ou-grid">
        {predictions.map(({ codes, label, total }) => {
          // Try both code variations due to API inconsistency
          let pred = null;
          for (const code of codes) {
            pred = getPredictionByType(code);
            if (pred) break;
          }
          if (!pred) return null;

          const { yes: over, no: under } = pred.predictions;

          const fairOddsOver = calculateDecimalOdds(over);
          const fairOddsUnder = calculateDecimalOdds(under);

          return (
            <div key={codes[0]} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                <span className="ou-percentage">{over?.toFixed(2)}%</span>
                <span className="ou-odds">Fair: {fairOddsOver}</span>
                {bet365Odds?.overUnder?.[total]?.yes && (
                  <>
                    <span className="ou-bookmaker bet365">Bet365: {bet365Odds.overUnder[total].yes.toFixed(2)}</span>
                    <span className="ou-value">Value: {calculateValueBet(bet365Odds.overUnder[total].yes, fairOddsOver)}%</span>
                  </>
                )}
                {unibetOdds?.overUnder?.[total]?.yes && (
                  <>
                    <span className="ou-bookmaker unibet">Unibet: {unibetOdds.overUnder[total].yes.toFixed(2)}</span>
                    <span className="ou-value">Value: {calculateValueBet(unibetOdds.overUnder[total].yes, fairOddsOver)}%</span>
                  </>
                )}
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                <span className="ou-percentage">{under?.toFixed(2)}%</span>
                <span className="ou-odds">Fair: {fairOddsUnder}</span>
                {bet365Odds?.overUnder?.[total]?.no && (
                  <>
                    <span className="ou-bookmaker bet365">Bet365: {bet365Odds.overUnder[total].no.toFixed(2)}</span>
                    <span className="ou-value">Value: {calculateValueBet(bet365Odds.overUnder[total].no, fairOddsUnder)}%</span>
                  </>
                )}
                {unibetOdds?.overUnder?.[total]?.no && (
                  <>
                    <span className="ou-bookmaker unibet">Unibet: {unibetOdds.overUnder[total].no.toFixed(2)}</span>
                    <span className="ou-value">Value: {calculateValueBet(unibetOdds.overUnder[total].no, fairOddsUnder)}%</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderBothTeamsToScore = () => {
    const pred = getPredictionByType('both-teams-to-score-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { yes, no } = pred.predictions;

    const fairOddsYes = calculateDecimalOdds(yes);
    const fairOddsNo = calculateDecimalOdds(no);

    return (
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-label">Yes</div>
          <div className="prediction-percentage">{yes?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsYes}</div>
          {renderBookmakerOdds(bet365Odds?.btts?.yes, unibetOdds?.btts?.yes, fairOddsYes)}
        </div>
        <div className="prediction-card">
          <div className="prediction-label">No</div>
          <div className="prediction-percentage">{no?.toFixed(2)}%</div>
          <div className="prediction-odds">Fair Odds: {fairOddsNo}</div>
          {renderBookmakerOdds(bet365Odds?.btts?.no, unibetOdds?.btts?.no, fairOddsNo)}
        </div>
      </div>
    );
  };

  const renderCorrectScore = () => {
    const pred = getPredictionByType('correct-score-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const scores = pred.predictions.scores || pred.predictions;
    const scoreEntries = Object.entries(scores).filter(([key]) => !key.startsWith('Other'));

    return (
      <div className="cs-grid">
        {scoreEntries.map(([score, percentage]) => (
          <div key={score} className="cs-card">
            <div className="cs-score">{score}</div>
            <div className="cs-percentage">{typeof percentage === 'number' ? percentage.toFixed(2) : '0.00'}%</div>
            <div className="cs-odds">{calculateDecimalOdds(percentage)}</div>
          </div>
        ))}
      </div>
    );
  };

  const renderTeamToScoreFirst = () => {
    const pred = getPredictionByType('team_to_score_first-probability');
    if (!pred) return <div className="no-data">No prediction data available</div>;

    const { home, away, draw } = pred.predictions;

    return (
      <div className="prediction-grid">
        <div className="prediction-card">
          <div className="prediction-label">Home First</div>
          <div className="prediction-percentage">{home?.toFixed(2)}%</div>
          <div className="prediction-odds">Odds: {calculateDecimalOdds(home)}</div>
        </div>
        <div className="prediction-card">
          <div className="prediction-label">Away First</div>
          <div className="prediction-percentage">{away?.toFixed(2)}%</div>
          <div className="prediction-odds">Odds: {calculateDecimalOdds(away)}</div>
        </div>
        {draw && (
          <div className="prediction-card">
            <div className="prediction-label">No Goals</div>
            <div className="prediction-percentage">{draw?.toFixed(2)}%</div>
            <div className="prediction-odds">Odds: {calculateDecimalOdds(draw)}</div>
          </div>
        )}
      </div>
    );
  };

  const renderHomeOverUnder = () => {
    const predictions = [
      { code: 'home-over-under-0_5_probability', label: 'Home O/U 0.5' },
      { code: 'home-over-under-1_5_probability', label: 'Home O/U 1.5' },
      { code: 'home-over-under-2_5_probability', label: 'Home O/U 2.5' },
      { code: 'home-over-under-3_5_probability', label: 'Home O/U 3.5' }
    ];

    const hasAnyData = predictions.some(({ code }) => getPredictionByType(code));
    if (!hasAnyData) return <div className="no-data">No prediction data available</div>;

    return (
      <div className="ou-grid">
        {predictions.map(({ code, label }) => {
          const pred = getPredictionByType(code);
          if (!pred) return null;

          const { yes: over, no: under } = pred.predictions;

          return (
            <div key={code} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                <span className="ou-percentage">{over?.toFixed(2)}%</span>
                <span className="ou-odds">{calculateDecimalOdds(over)}</span>
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                <span className="ou-percentage">{under?.toFixed(2)}%</span>
                <span className="ou-odds">{calculateDecimalOdds(under)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAwayOverUnder = () => {
    const predictions = [
      { code: 'away-over-under-0_5_probability', label: 'Away O/U 0.5' },
      { code: 'away-over-under-1_5_probability', label: 'Away O/U 1.5' },
      { code: 'away-over-under-2_5_probability', label: 'Away O/U 2.5' },
      { code: 'away-over-under-3_5_probability', label: 'Away O/U 3.5' }
    ];

    const hasAnyData = predictions.some(({ code }) => getPredictionByType(code));
    if (!hasAnyData) return <div className="no-data">No prediction data available</div>;

    return (
      <div className="ou-grid">
        {predictions.map(({ code, label }) => {
          const pred = getPredictionByType(code);
          if (!pred) return null;

          const { yes: over, no: under } = pred.predictions;

          return (
            <div key={code} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                <span className="ou-percentage">{over?.toFixed(2)}%</span>
                <span className="ou-odds">{calculateDecimalOdds(over)}</span>
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                <span className="ou-percentage">{under?.toFixed(2)}%</span>
                <span className="ou-odds">{calculateDecimalOdds(under)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCornersOverUnder = () => {
    // Extended list to support Unibet's wider range
    const predictions = [
      { code: 'corners-over-under-4-probability', label: 'Corners O/U 4', total: '4' },
      { code: 'corners-over-under-5-probability', label: 'Corners O/U 5', total: '5' },
      { code: 'corners-over-under-6-probability', label: 'Corners O/U 6', total: '6' },
      { code: 'corners-over-under-6_5-probability', label: 'Corners O/U 6.5', total: '6.5' },
      { code: 'corners-over-under-7-probability', label: 'Corners O/U 7', total: '7' },
      { code: 'corners-over-under-7_5-probability', label: 'Corners O/U 7.5', total: '7.5' },
      { code: 'corners-over-under-8-probability', label: 'Corners O/U 8', total: '8' },
      { code: 'corners-over-under-8_5-probability', label: 'Corners O/U 8.5', total: '8.5' },
      { code: 'corners-over-under-9-probability', label: 'Corners O/U 9', total: '9' },
      { code: 'corners-over-under-9_5-probability', label: 'Corners O/U 9.5', total: '9.5' },
      { code: 'corners-over-under-10-probability', label: 'Corners O/U 10', total: '10' },
      { code: 'corners-over-under-10_5-probability', label: 'Corners O/U 10.5', total: '10.5' },
      { code: 'corners-over-under-11-probability', label: 'Corners O/U 11', total: '11' },
      { code: 'corners-over-under-11_5-probability', label: 'Corners O/U 11.5', total: '11.5' },
      { code: 'corners-over-under-12-probability', label: 'Corners O/U 12', total: '12' },
      { code: 'corners-over-under-12_5-probability', label: 'Corners O/U 12.5', total: '12.5' },
    ];

    // Show lines that have either predictions OR bookmaker odds
    const hasAnyData = predictions.some(({ code, total }) =>
      getPredictionByType(code) || bet365Odds?.corners?.[total] || unibetOdds?.corners?.[total]
    );
    if (!hasAnyData) return <div className="no-data">No corner data available</div>;

    return (
      <div className="ou-grid">
        {predictions.map(({ code, label, total }) => {
          const pred = getPredictionByType(code);
          const bet365Corner = bet365Odds?.corners?.[total];
          const unibetCorner = unibetOdds?.corners?.[total];

          // Skip if no prediction AND no odds from either bookmaker
          if (!pred && !bet365Corner && !unibetCorner) return null;

          const { yes: over, no: under, equal } = pred?.predictions || {};

          const fairOddsOver = over ? calculateDecimalOdds(over) : null;
          const fairOddsUnder = under ? calculateDecimalOdds(under) : null;
          const fairOddsEqual = equal ? calculateDecimalOdds(equal) : null;

          return (
            <div key={code} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                {over && <span className="ou-percentage">{over?.toFixed(2)}%</span>}
                {fairOddsOver && <span className="ou-odds">Fair: {fairOddsOver}</span>}
                {bet365Corner?.yes && (
                  <>
                    <span className="ou-bookmaker bet365">Bet365: {bet365Corner.yes.toFixed(2)}</span>
                    {fairOddsOver && <span className="ou-value">Value: {calculateValueBet(bet365Corner.yes, fairOddsOver)}%</span>}
                  </>
                )}
                {unibetCorner?.yes && (
                  <>
                    <span className="ou-bookmaker unibet">Unibet: {unibetCorner.yes.toFixed(2)}</span>
                    {fairOddsOver && <span className="ou-value">Value: {calculateValueBet(unibetCorner.yes, fairOddsOver)}%</span>}
                  </>
                )}
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                {under && <span className="ou-percentage">{under?.toFixed(2)}%</span>}
                {fairOddsUnder && <span className="ou-odds">Fair: {fairOddsUnder}</span>}
                {bet365Corner?.no && (
                  <>
                    <span className="ou-bookmaker bet365">Bet365: {bet365Corner.no.toFixed(2)}</span>
                    {fairOddsUnder && <span className="ou-value">Value: {calculateValueBet(bet365Corner.no, fairOddsUnder)}%</span>}
                  </>
                )}
                {unibetCorner?.no && (
                  <>
                    <span className="ou-bookmaker unibet">Unibet: {unibetCorner.no.toFixed(2)}</span>
                    {fairOddsUnder && <span className="ou-value">Value: {calculateValueBet(unibetCorner.no, fairOddsUnder)}%</span>}
                  </>
                )}
              </div>
              {(equal || bet365Corner?.equal || unibetCorner?.equal) && (
                <div className="ou-option equal">
                  <span className="ou-text">Equal</span>
                  {equal && <span className="ou-percentage">{equal?.toFixed(2)}%</span>}
                  {fairOddsEqual && <span className="ou-odds">Fair: {fairOddsEqual}</span>}
                  {bet365Corner?.equal && (
                    <>
                      <span className="ou-bookmaker bet365">Bet365: {bet365Corner.equal.toFixed(2)}</span>
                      {fairOddsEqual && <span className="ou-value">Value: {calculateValueBet(bet365Corner.equal, fairOddsEqual)}%</span>}
                    </>
                  )}
                  {unibetCorner?.equal && (
                    <>
                      <span className="ou-bookmaker unibet">Unibet: {unibetCorner.equal.toFixed(2)}</span>
                      {fairOddsEqual && <span className="ou-value">Value: {calculateValueBet(unibetCorner.equal, fairOddsEqual)}%</span>}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="match-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !fixture) {
    return (
      <div className="match-details-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const homeTeam = fixture.participants?.find(p => p.meta?.location === 'home');
  const awayTeam = fixture.participants?.find(p => p.meta?.location === 'away');

  const renderTeamShots = () => {
    const lines = [
      { label: 'Team Shots O/U 12.5', total: '12.5' },
      { label: 'Team Shots O/U 13.5', total: '13.5' }
    ];

    const hasAnyData = lines.some(({ total }) =>
      bet365Odds?.teamShots?.[total]
    );
    if (!hasAnyData) return <div className="no-data">No odds available for Team Shots</div>;

    return (
      <div className="ou-grid">
        {lines.map(({ label, total }) => {
          const odds = bet365Odds?.teamShots?.[total];
          if (!odds) return null;

          const fairOddsOver = odds.yesProb ? calculateDecimalOdds(odds.yesProb) : null;
          const fairOddsUnder = odds.noProb ? calculateDecimalOdds(odds.noProb) : null;

          return (
            <div key={total} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                {odds.yesProb && <span className="ou-percentage">{odds.yesProb.toFixed(1)}%</span>}
                {fairOddsOver && <span className="ou-odds">Fair: {fairOddsOver}</span>}
                <span className="ou-bookmaker bet365">Bet365: {odds.yes.toFixed(2)}</span>
                {fairOddsOver && (
                  <span className="ou-value">Value: {calculateValueBet(odds.yes, fairOddsOver)}%</span>
                )}
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                {odds.noProb && <span className="ou-percentage">{odds.noProb.toFixed(1)}%</span>}
                {fairOddsUnder && <span className="ou-odds">Fair: {fairOddsUnder}</span>}
                <span className="ou-bookmaker bet365">Bet365: {odds.no.toFixed(2)}</span>
                {fairOddsUnder && (
                  <span className="ou-value">Value: {calculateValueBet(odds.no, fairOddsUnder)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTeamShotsOnTarget = () => {
    const lines = [
      { label: 'Team Shots on Target O/U 4.5', total: '4.5' }
    ];

    const hasAnyData = lines.some(({ total }) =>
      bet365Odds?.teamShotsOnTarget?.[total]
    );
    if (!hasAnyData) return <div className="no-data">No odds available for Team Shots on Target</div>;

    return (
      <div className="ou-grid">
        {lines.map(({ label, total }) => {
          const odds = bet365Odds?.teamShotsOnTarget?.[total];
          if (!odds) return null;

          const fairOddsOver = odds.yesProb ? calculateDecimalOdds(odds.yesProb) : null;
          const fairOddsUnder = odds.noProb ? calculateDecimalOdds(odds.noProb) : null;

          return (
            <div key={total} className="ou-row">
              <div className="ou-label">{label}</div>
              <div className="ou-option over">
                <span className="ou-text">Over</span>
                {odds.yesProb && <span className="ou-percentage">{odds.yesProb.toFixed(1)}%</span>}
                {fairOddsOver && <span className="ou-odds">Fair: {fairOddsOver}</span>}
                <span className="ou-bookmaker bet365">Bet365: {odds.yes.toFixed(2)}</span>
                {fairOddsOver && (
                  <span className="ou-value">Value: {calculateValueBet(odds.yes, fairOddsOver)}%</span>
                )}
              </div>
              <div className="ou-option under">
                <span className="ou-text">Under</span>
                {odds.noProb && <span className="ou-percentage">{odds.noProb.toFixed(1)}%</span>}
                {fairOddsUnder && <span className="ou-odds">Fair: {fairOddsUnder}</span>}
                <span className="ou-bookmaker bet365">Bet365: {odds.no.toFixed(2)}</span>
                {fairOddsUnder && (
                  <span className="ou-value">Value: {calculateValueBet(odds.no, fairOddsUnder)}%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper functions to check if markets have data
  const hasFulltimeData = () => {
    return getPredictionByType('winner') || bet365Odds?.fulltime || unibetOdds?.fulltime;
  };

  const hasHalftimeData = () => {
    return getPredictionByType('first-half-winner') || bet365Odds?.halftime || unibetOdds?.halftime;
  };

  const hasDoubleChanceData = () => {
    return getPredictionByType('double_chance-probability') || bet365Odds?.doubleChance || unibetOdds?.doubleChance;
  };

  const hasHtftData = () => {
    return getPredictionByType('half-time-full-time-probability') || bet365Odds?.htft || unibetOdds?.htft;
  };

  const hasOverUnderData = () => {
    const predictions = [
      { codes: ['over-under-1_5-probability', 'over-under-1_5_probability'] },
      { codes: ['over-under-2_5-probability', 'over-under-2_5_probability'] },
      { codes: ['over-under-3_5-probability', 'over-under-3_5_probability'] },
      { codes: ['over-under-4_5-probability', 'over-under-4_5_probability'] }
    ];
    return predictions.some(({ codes }) => codes.some(code => getPredictionByType(code)));
  };

  const hasBttsData = () => {
    return getPredictionByType('both-teams-to-score-probability') || bet365Odds?.btts || unibetOdds?.btts;
  };

  const hasCorrectScoreData = () => {
    return getPredictionByType('correct-score-probability');
  };

  const hasFirstGoalData = () => {
    return getPredictionByType('team-to-score-first-probability');
  };

  const hasHomeOverUnderData = () => {
    return getPredictionByType('home-over-under-0_5-probability') ||
           getPredictionByType('home-over-under-1_5-probability') ||
           getPredictionByType('home-over-under-2_5-probability');
  };

  const hasAwayOverUnderData = () => {
    return getPredictionByType('away-over-under-0_5-probability') ||
           getPredictionByType('away-over-under-1_5-probability') ||
           getPredictionByType('away-over-under-2_5-probability');
  };

  const hasCornersData = () => {
    const predictions = [
      { code: 'corners-over-under-4-probability', total: '4' },
      { code: 'corners-over-under-5-probability', total: '5' },
      { code: 'corners-over-under-6-probability', total: '6' },
      { code: 'corners-over-under-6_5-probability', total: '6.5' },
      { code: 'corners-over-under-7-probability', total: '7' },
      { code: 'corners-over-under-7_5-probability', total: '7.5' },
      { code: 'corners-over-under-8-probability', total: '8' },
      { code: 'corners-over-under-8_5-probability', total: '8.5' },
      { code: 'corners-over-under-9-probability', total: '9' },
      { code: 'corners-over-under-9_5-probability', total: '9.5' },
      { code: 'corners-over-under-10-probability', total: '10' },
      { code: 'corners-over-under-10_5-probability', total: '10.5' },
      { code: 'corners-over-under-11-probability', total: '11' },
      { code: 'corners-over-under-11_5-probability', total: '11.5' },
      { code: 'corners-over-under-12-probability', total: '12' },
      { code: 'corners-over-under-12_5-probability', total: '12.5' }
    ];
    return predictions.some(({ code, total }) =>
      getPredictionByType(code) || bet365Odds?.corners?.[total] || unibetOdds?.corners?.[total]
    );
  };

  const hasTeamShotsData = () => {
    const lines = ['12.5', '13.5'];
    return lines.some(total => bet365Odds?.teamShots?.[total]);
  };

  const hasTeamShotsOnTargetData = () => {
    return bet365Odds?.teamShotsOnTarget?.['4.5'];
  };

  // Build tabs array with only markets that have data
  const allTabs = [
    { id: 'fulltime', label: 'Fulltime Result', render: renderFulltimeResult, hasData: hasFulltimeData },
    { id: 'halftime', label: 'First Half Winner', render: renderFirstHalfWinner, hasData: hasHalftimeData },
    { id: 'doublechance', label: 'Double Chance', render: renderDoubleChance, hasData: hasDoubleChanceData },
    { id: 'htft', label: 'Half Time/Full Time', render: renderHalfTimeFullTime, hasData: hasHtftData },
    { id: 'overunder', label: 'Over/Under', render: renderOverUnder, hasData: hasOverUnderData },
    { id: 'btts', label: 'Both Teams To Score', render: renderBothTeamsToScore, hasData: hasBttsData },
    { id: 'correctscore', label: 'Correct Score', render: renderCorrectScore, hasData: hasCorrectScoreData },
    { id: 'firstgoal', label: 'First Goal', render: renderTeamToScoreFirst, hasData: hasFirstGoalData },
    { id: 'homeou', label: 'Home O/U', render: renderHomeOverUnder, hasData: hasHomeOverUnderData },
    { id: 'awayou', label: 'Away O/U', render: renderAwayOverUnder, hasData: hasAwayOverUnderData },
    { id: 'corners', label: 'Corners O/U', render: renderCornersOverUnder, hasData: hasCornersData },
    { id: 'teamshots', label: 'Team Shots', render: renderTeamShots, hasData: hasTeamShotsData },
    { id: 'teamshotsontarget', label: 'Team Shots on Target', render: renderTeamShotsOnTarget, hasData: hasTeamShotsOnTargetData }
  ];

  // Filter to only include tabs with data
  const tabs = allTabs.filter(tab => tab.hasData());

  return (
    <div className="match-details-page">
      <button onClick={() => navigate('/')} className="back-button">
        ← Back
      </button>

      {/* Match Header */}
      <div className="match-header">
        <div className="match-date">
          {formatDate(fixture.starting_at)}
        </div>
        <div className="match-league">
          {fixture.league?.image_path && (
            <img src={fixture.league.image_path} alt={fixture.league.name} />
          )}
          <span>{fixture.league?.name}</span>
        </div>

        <div className="match-teams">
          <div className="team">
            {homeTeam?.image_path && (
              <img src={homeTeam.image_path} alt={homeTeam.name} />
            )}
            <span>{homeTeam?.name}</span>
          </div>
          <div className="match-status">
            <span className={`status-badge ${fixture.state?.developer_name?.toLowerCase()}`}>
              {fixture.state?.name}
            </span>
            <span className="match-time">{fixture.starting_at?.split(' ')[1]}</span>
          </div>
          <div className="team">
            {awayTeam?.image_path && (
              <img src={awayTeam.image_path} alt={awayTeam.name} />
            )}
            <span>{awayTeam?.name}</span>
          </div>
        </div>
      </div>

      {/* Value Bet Filter Bar */}
      <div className="value-filter-bar">
        <div className="filter-summary">
          <span className="value-count">{countValueBets()} Value Bets Found</span>
        </div>
        <div className="filter-controls">
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showOnlyValueBets}
              onChange={(e) => setShowOnlyValueBets(e.target.checked)}
            />
            <span>Show Only Value Bets</span>
          </label>
          <label className="filter-slider">
            <span>Min Value: {minValueThreshold}%</span>
            <input
              type="range"
              min="100"
              max="120"
              step="1"
              value={minValueThreshold}
              onChange={(e) => setMinValueThreshold(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Predictions Section */}
      <div className="predictions-section">
        <h2>Predictions</h2>

        <div className="predictions-tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${(activeTab === tab.id || (!tabs.find(t => t.id === activeTab) && index === 0)) ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="predictions-content">
          {(tabs.find(t => t.id === activeTab) || tabs[0])?.render()}
        </div>
      </div>

      {/* Venue Info */}
      {fixture.venue && (
        <div className="venue-info">
          <h3>Venue</h3>
          <p>{fixture.venue.name}</p>
          {fixture.venue.city_name && <p>{fixture.venue.city_name}</p>}
        </div>
      )}
    </div>
  );
};

export default MatchDetails;
