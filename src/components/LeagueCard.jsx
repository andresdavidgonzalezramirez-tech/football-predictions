import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LeagueCard.css';

/**
 * LeagueCard Component
 * Expandable card that displays a league with its upcoming fixtures
 */
const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleFixtureClick = (fixtureId) => {
    navigate(`/match/${fixtureId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('da-DK', options);
  };

  const isMatchStarted = (startingAt) => {
    const matchTime = new Date(startingAt);
    const now = new Date();
    return now >= matchTime;
  };

  const getTeamNames = (fixtureName) => {
    const parts = fixtureName.split(' vs ');
    if (parts.length === 2) {
      return { home: parts[0].trim(), away: parts[1].trim() };
    }
    return { home: fixtureName, away: '' };
  };

  const upcomingCount = league.upcoming?.length || 0;

  return (
    <div className="league-card">
      {/* League Header - Clickable to expand/collapse */}
      <div
        className="league-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="league-info">
          {league.image_path && (
            <img
              src={league.image_path}
              alt={league.name}
              className="league-logo"
            />
          )}
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            {league.country && (
              <p className="league-country">{league.country.name}</p>
            )}
          </div>
        </div>

        <div className="league-meta">
          <span className="fixtures-count">
            {upcomingCount} {upcomingCount === 1 ? 'match' : 'matches'}
          </span>
          <svg
            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Fixtures List - Shown when expanded */}
      {isExpanded && upcomingCount > 0 && (
        <div className="fixtures-list">
          {league.upcoming.map((fixture) => {
            const teams = getTeamNames(fixture.name);

            return (
              <div
                key={fixture.id}
                className="fixture-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFixtureClick(fixture.id);
                }}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFixtureClick(fixture.id);
                  }
                }}
              >
                <div className="fixture-teams">
                  <div className="team-row">
                    <span className="team-name home-team">{teams.home}</span>
                  </div>
                  <div className="team-row">
                    <span className="team-name away-team">{teams.away}</span>
                  </div>
                </div>

                <div className="fixture-meta">
                  {isMatchStarted(fixture.starting_at) ? (
                    <span className="status-badge live">● LIVE</span>
                  ) : (
                    <span className="fixture-date">
                      {formatDate(fixture.starting_at)}
                    </span>
                  )}
                  {fixture.has_odds && (
                    <span className="odds-badge">Odds</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state when no fixtures */}
      {isExpanded && upcomingCount === 0 && (
        <div className="no-fixtures">
          <p>No upcoming fixtures</p>
        </div>
      )}
    </div>
  );
};

export default LeagueCard;
