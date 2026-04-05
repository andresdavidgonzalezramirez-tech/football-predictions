import { useNavigate } from 'react-router-dom';
import './FixtureCard.css';

/**
 * FixtureCard Component
 * Displays fixture information in a card format with click navigation
 *
 * @param {Object} props
 * @param {Object} props.fixture - Fixture data object
 * @param {number} props.fixture.id - Fixture ID
 * @param {string} props.fixture.name - Fixture name
 * @param {string} props.fixture.starting_at - Start date/time
 * @param {Array} props.fixture.participants - Array of participating teams
 * @param {Object} props.fixture.state - Match state
 * @param {Object} props.fixture.scores - Match scores
 * @returns {JSX.Element}
 */
const FixtureCard = ({ fixture }) => {
  const navigate = useNavigate();

  if (!fixture) return null;

  const { id, name, starting_at, participants = [], state, scores } = fixture;

  // Extract team names
  const homeTeam = participants?.find(p => p.meta?.location === 'home')?.name || 'Home Team';
  const awayTeam = participants?.find(p => p.meta?.location === 'away')?.name || 'Away Team';

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get match status
  const getMatchStatus = () => {
    if (state?.state === 'LIVE') return 'LIVE';
    if (state?.state === 'FT') return 'FT';
    if (state?.state === 'NS') return 'Upcoming';
    return state?.state || 'Scheduled';
  };

  const handleClick = () => {
    navigate(`/match/${id}`);
  };

  const matchStatus = getMatchStatus();
  const isLive = matchStatus === 'LIVE';

  return (
    <div
      className={`fixture-card ${isLive ? 'live' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={`View details for ${homeTeam} vs ${awayTeam}`}
    >
      <div className="fixture-card-header">
        <span className={`fixture-status ${isLive ? 'live-indicator' : ''}`}>
          {matchStatus}
        </span>
        <span className="fixture-date">{formatDate(starting_at)}</span>
      </div>

      <div className="fixture-teams">
        <div className="team-row">
          <span className="team-name">{homeTeam}</span>
          {scores && (
            <span className="team-score">
              {scores[0]?.score?.goals || 0}
            </span>
          )}
        </div>
        <div className="team-divider">vs</div>
        <div className="team-row">
          <span className="team-name">{awayTeam}</span>
          {scores && (
            <span className="team-score">
              {scores[1]?.score?.goals || 0}
            </span>
          )}
        </div>
      </div>

      <div className="fixture-card-footer">
        <span className="view-details">View Predictions</span>
        <span className="arrow">→</span>
      </div>
    </div>
  );
};

export default FixtureCard;
