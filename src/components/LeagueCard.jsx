import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { getPredictionsByFixture } from '../modules/predictions/services/predictions.service';
import { formatProbabilityValue } from '../utils/marketTranslations';
import './LeagueCard.css';

const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [predictionsByFixture, setPredictionsByFixture] = useState({});
  const [predictionStatusByFixture, setPredictionStatusByFixture] = useState({});
  const navigate = useNavigate();

  const fixtures = useMemo(
    () => (Array.isArray(league?.upcomingFixtures) ? league.upcomingFixtures : []),
    [league],
  );

  const getPredictableBadge = (fixture) => {
    if (fixture.predictable === true || Number(fixture.predictable) > 0) return 'available';
    return 'empty';
  };

  useEffect(() => {
    if (!isExpanded || fixtures.length === 0) return;
    let cancelled = false;

    const loadPredictions = async () => {
      const nextPredictions = {};
      const nextStatuses = {};

      await Promise.all(
        fixtures.map(async (fixture) => {
          try {
            const predictions = await getPredictionsByFixture(fixture.fixtureId);
            nextPredictions[fixture.fixtureId] = predictions;
            nextStatuses[fixture.fixtureId] = predictions.length > 0 ? 'available' : 'empty';
          } catch (error) {
            nextPredictions[fixture.fixtureId] = [];
            nextStatuses[fixture.fixtureId] = error.kind === 'plan_restricted' ? 'restricted' : 'empty';
          }
        }),
      );

      if (!cancelled) {
        setPredictionsByFixture((prev) => ({ ...prev, ...nextPredictions }));
        setPredictionStatusByFixture((prev) => ({ ...prev, ...nextStatuses }));
      }
    };

    loadPredictions();
    return () => { cancelled = true; };
  }, [isExpanded, fixtures]);

  const predictionOptionsPreview = (fixtureId) => {
    const market = (predictionsByFixture[fixtureId] ?? [])[0];
    if (!market?.options?.length) return null;

    return market.options.slice(0, 3).map((option) => (
      <span key={`${fixtureId}-${option.key}`} className="fixture-market-pill">
        {option.label}: {formatProbabilityValue(option.value)}
      </span>
    ));
  };

  return (
    <div className="league-card sportsbook-row">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className="league-info league-info-compact">
          <div className="league-logo-wrap">
            <img src={league.image_path || '/vite.svg'} alt={league.name || 'Liga'} className="league-logo" />
          </div>
          <div className="league-details">
            <h3 className="league-name">{league.name}</h3>
            <p className="league-country">{league.country?.name ?? 'Dato no disponible'}</p>
          </div>
        </div>

        <div className="league-meta sportsbook-meta">
          <span className="fixtures-count">{fixtures.length} partidos</span>
          <Badge status="available" label="Predictions API" />
        </div>
      </div>

      {isExpanded && (
        <div className="fixtures-list sportsbook-table">
          <div className="fixture-table-head">
            <span>Hora</span>
            <span>Partido</span>
            <span>Predicción principal</span>
            <span>Estado</span>
          </div>

          {fixtures.map((fixture) => (
            <div
              key={fixture.fixtureId}
              className="fixture-item sportsbook-fixture-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/match/${fixture.fixtureId}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/match/${fixture.fixtureId}`)}
            >
              <div className="fixture-time">{fixture.kickoff || 'Hora N/D'}</div>

              <div className="fixture-teams compact">
                <div className="team-block">
                  <img src={fixture.homeLogo || '/vite.svg'} alt="Home" />
                  <span className="team-name">{fixture.participants?.home?.name || 'Local'}</span>
                </div>
                <strong className="fixture-vs">vs</strong>
                <div className="team-block">
                  <img src={fixture.awayLogo || '/vite.svg'} alt="Away" />
                  <span className="team-name">{fixture.participants?.away?.name || 'Visitante'}</span>
                </div>
              </div>

              <div className="fixture-market-preview">
                {predictionOptionsPreview(fixture.fixtureId) || (
                  <span className="fixture-extra">
                    {predictionStatusByFixture[fixture.fixtureId] === 'restricted'
                      ? 'No incluido en tu plan'
                      : 'Sin predicciones'}
                  </span>
                )}
              </div>

              <div className="fixture-badges">
                <Badge status={getPredictableBadge(fixture)} label="Predictable" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;
