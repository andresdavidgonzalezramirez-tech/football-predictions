import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { getProbabilitiesByFixture } from '../services/sportsmonksApi';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import { formatProbabilityValue, translateOptionKey } from '../utils/marketTranslations';
import './LeagueCard.css';

const LeagueCard = ({ league }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const fixtures = useMemo(() => {
    const fixturesRaw = league?.upcoming?.data ?? league?.upcoming ?? [];
    return fixturesRaw.map(normalizeFixture).filter(Boolean);
  }, [league]);
  const [marketsByFixture, setMarketsByFixture] = useState({});
  const [marketStatusByFixture, setMarketStatusByFixture] = useState({});
  const getPredictableBadge = (fixture) => {
    if (fixture.predictable === true || Number(fixture.predictable) > 0) return 'available';
    return 'empty';
  };

  useEffect(() => {
    if (!isExpanded || fixtures.length === 0) return;
    let cancelled = false;

    const loadMarkets = async () => {
      const nextMarkets = {};
      const nextStatuses = {};

      await Promise.all(
        fixtures.slice(0, 6).map(async (fixture) => {
          try {
            const response = await getProbabilitiesByFixture(fixture.fixtureId);
            const normalized = normalizeProbabilities(response);
            nextMarkets[fixture.fixtureId] = normalized.items;
            nextStatuses[fixture.fixtureId] = normalized.items.length > 0 ? 'available' : 'empty';
          } catch (error) {
            nextMarkets[fixture.fixtureId] = [];
            nextStatuses[fixture.fixtureId] = error.kind === 'plan_restricted' ? 'restricted' : 'empty';
          }
        }),
      );

      if (!cancelled) {
        setMarketsByFixture((prev) => ({ ...prev, ...nextMarkets }));
        setMarketStatusByFixture((prev) => ({ ...prev, ...nextStatuses }));
      }
    };

    loadMarkets();

    return () => {
      cancelled = true;
    };
  }, [isExpanded, fixtures]);

  const marketOptionsPreview = (fixtureId) => {
    const markets = marketsByFixture[fixtureId] ?? [];
    const market = markets[0];
    if (!market?.options?.length) return null;
    return market.options.slice(0, 3).map((option) => (
      <span key={`${fixtureId}-${option.key}`} className="fixture-market-pill">
        {translateOptionKey(option.key, market)}: {formatProbabilityValue(option.value)}
      </span>
    ));
  };

  return (
    <div className="league-card sportsbook-row">
      <div
        className="league-card-header"
        onClick={() => setIsExpanded((value) => !value)}
        role="button"
        tabIndex={0}
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
          <Badge
            status={fixtures.some((fixture) => fixture.hasOdds) ? 'available' : 'empty'}
            label={fixtures.some((fixture) => fixture.hasOdds) ? 'Con cuotas' : 'Sin cuotas'}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="fixtures-list sportsbook-table">
          <div className="fixture-table-head">
            <span>Hora</span>
            <span>Partido</span>
            <span>Mercado principal</span>
            <span>Estado</span>
          </div>
          {fixtures.map((fixture) => (
            <div
              key={fixture.fixtureId}
              className="fixture-item sportsbook-fixture-row"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/match/${fixture.fixtureId}`)}
            >
              <div className="fixture-time">{fixture.kickoff || 'Hora no disponible'}</div>
              <div className="fixture-teams compact">
                <div className="team-block">
                  <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name || 'Local'} />
                  <span className="team-name">{fixture.participants?.home?.name || 'Local'}</span>
                </div>
                <strong className="fixture-vs">vs</strong>
                <div className="team-block">
                  <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name || 'Visitante'} />
                  <span className="team-name">{fixture.participants?.away?.name || 'Visitante'}</span>
                </div>
              </div>
              <div className="fixture-market-preview">
                {marketOptionsPreview(fixture.fixtureId) || (
                  <span className="fixture-extra">
                    {marketStatusByFixture[fixture.fixtureId] === 'restricted'
                      ? 'No incluido en tu plan'
                      : 'Sin probabilidades para este partido'}
                  </span>
                )}
              </div>
              <div className="fixture-badges">
                <Badge status={fixture.hasOdds ? 'available' : 'empty'} label="Cuotas" />
                <Badge status={getPredictableBadge(fixture)} label="Predicción" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueCard;
