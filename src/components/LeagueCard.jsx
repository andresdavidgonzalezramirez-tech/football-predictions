import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import './LeagueCard.css';

const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const fixtures = (league.upcoming ?? []).map(normalizeFixture).filter(Boolean);

  return (
    <div className="league-card">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((value) => !value)}
        role="button"
        tabIndex={0}
      >
        <div className="league-info">
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            <p className="league-country">{league.country?.name ?? 'No disponible'}</p>
          </div>
        </div>

        <div className="league-meta">
          <span className="fixtures-count">{fixtures.length} matches</span>
        </div>
      </div>

      {isExpanded && (
        <div className="fixtures-list">
          {fixtures.map((fixture) => (
            <div
              key={fixture.fixtureId}
              className="fixture-item"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/match/${fixture.fixtureId}`)}
            >
              <div className="fixture-teams">
                <div className="team-row">
                  <span className="team-name">{fixture.teamsLabel}</span>
                </div>
              </div>
              <div className="fixture-meta">
                <span className="fixture-date">{fixture.kickoff ?? 'No disponible'}</span>
                <span className="odds-badge">Predictable: {fixture.predictable === null ? 'No disponible' : String(fixture.predictable)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;
