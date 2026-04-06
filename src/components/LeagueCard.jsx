import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import './LeagueCard.css';

const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const fixturesRaw = league?.upcoming?.data ?? league?.upcoming ?? [];
  const fixtures = fixturesRaw.map(normalizeFixture).filter(Boolean);
  const getPredictableBadge = (fixture) => {
    if (fixture.predictable === true || Number(fixture.predictable) > 0) return 'available';
    return 'empty';
  };

  return (
    <div className="league-card fp-glow">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((value) => !value)}
        role="button"
        tabIndex={0}
      >
        <div className="league-info">
          <div className="league-logo-wrap">
            <img src={league.image_path || '/vite.svg'} alt={league.name || 'Liga'} className="league-logo" />
          </div>
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            <p className="league-country">{league.country?.name ?? 'País por confirmar'}</p>
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
              <div className="fixture-core">
                <div className="fixture-teams">
                  <div className="team-block">
                    <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name || 'Local'} />
                    <span className="team-name">{fixture.participants?.home?.name || 'Local'}</span>
                  </div>
                  <strong className="fixture-vs">VS</strong>
                  <div className="team-block">
                    <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name || 'Visitante'} />
                    <span className="team-name">{fixture.participants?.away?.name || 'Visitante'}</span>
                  </div>
                </div>
                <div className="fixture-meta">
                  <span className="fixture-date">{fixture.kickoff || 'Fecha pendiente'}</span>
                  <span className="fixture-venue">{fixture.venue || 'Venue por confirmar'}</span>
                  <span className="fixture-extra">Estado: {fixture.state || 'Dato no disponible'}</span>
                  <span className="fixture-extra">Round: {fixture.round || 'Dato no disponible'}</span>
                </div>
              </div>
              <div className="fixture-badges">
                <Badge status={fixture.hasOdds ? 'available' : 'empty'} label="Odds" />
                <Badge status={fixture.hasPremiumOdds ? 'available' : 'restricted'} label="Premium" />
                <Badge status={getPredictableBadge(fixture)} label="Predictible" />
                <Badge status={fixture.placeholder ? 'empty' : 'available'} label={fixture.placeholder ? 'Placeholder API' : 'Fixture oficial'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;
