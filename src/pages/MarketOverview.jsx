import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/Badge';
import { getLeaguesWithUpcoming, getProbabilitiesByFixture } from '../services/sportsmonksApi';
import { formatProbabilityValue } from '../utils/marketTranslations';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import '../components/LeagueCard.css';
import './MatchDetails.css';

const toDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatKickoff = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const getPredictableBadge = (fixture) => {
  if (fixture.predictable === true || Number(fixture.predictable) > 0) return 'available';
  return 'empty';
};

const MarketOverview = () => {
  const [fixtures, setFixtures] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marketsByFixture, setMarketsByFixture] = useState({});
  const [marketStatusByFixture, setMarketStatusByFixture] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const leaguesResponse = await getLeaguesWithUpcoming();
        const rawFixtures = (leaguesResponse?.data ?? []).flatMap(
          (league) => league?.upcoming?.data ?? league?.upcoming ?? [],
        );
        setFixtures(rawFixtures.map(normalizeFixture).filter(Boolean));
      } catch (err) {
        setError(err.message ?? 'No se pudo construir el resumen de mercado.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const todayFixtures = useMemo(() => (
    fixtures
      .filter((fixture) => toDateKey(fixture.kickoff) === todayKey)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
  ), [fixtures, todayKey]);

  useEffect(() => {
    if (!todayFixtures.length) return;

    let cancelled = false;

    const loadMarkets = async () => {
      const nextMarkets = {};
      const nextStatuses = {};

      await Promise.all(
        todayFixtures.map(async (fixture) => {
          try {
            const response = await getProbabilitiesByFixture(fixture.fixtureId);
            const normalized = normalizeProbabilities(response);
            nextMarkets[fixture.fixtureId] = normalized.items;
            nextStatuses[fixture.fixtureId] = normalized.items.length > 0 ? 'available' : 'empty';
          } catch (marketError) {
            nextMarkets[fixture.fixtureId] = [];
            nextStatuses[fixture.fixtureId] = marketError.kind === 'plan_restricted' ? 'restricted' : 'empty';
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
  }, [todayFixtures]);

  const marketOptionsPreview = (fixtureId) => {
    const market = (marketsByFixture[fixtureId] ?? [])[0];
    if (!market?.options?.length) {
      if (marketStatusByFixture[fixtureId] === 'restricted') return 'No incluido en tu plan';
      return '—';
    }

    return market.options.slice(0, 3).map((option) => (
      <span key={`${fixtureId}-${option.key}`} className="fixture-market-pill">
        {option.label}: {formatProbabilityValue(option.value)}
      </span>
    ));
  };

  if (loading) return <main className="dashboard"><p>Cargando resumen de mercado…</p></main>;
  if (error) return <main className="dashboard"><p>{error}</p></main>;

  return (
    <main className="dashboard">
      <section className="general-list">
        <Link to="/" className="fixtures-count" style={{ display: 'inline-flex', marginBottom: 12 }}>
          ← Volver al inicio
        </Link>

        <h2>Resumen de mercado — Partidos de hoy</h2>

        {todayFixtures.length === 0 ? (
          <p style={{ marginTop: 12 }}>No hay partidos programados para hoy.</p>
        ) : (
          <div className="fixtures-list sportsbook-table" style={{ marginTop: 12 }}>
            <div className="fixture-table-head">
              <span>Hora</span>
              <span>Partido</span>
              <span>Mercado principal</span>
              <span>Estado</span>
            </div>

            {todayFixtures.map((fixture) => (
              <Link
                key={fixture.fixtureId}
                to={`/match/${fixture.fixtureId}`}
                className="fixture-item sportsbook-fixture-row"
              >
                <div className="fixture-time">{formatKickoff(fixture.kickoff)}</div>

                <div className="fixture-teams compact">
                  <div className="team-block">
                    <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name || 'Local'} />
                    <span className="team-name">{fixture.participants?.home?.name || '—'}</span>
                  </div>
                  <strong className="fixture-vs">vs</strong>
                  <div className="team-block">
                    <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name || 'Visitante'} />
                    <span className="team-name">{fixture.participants?.away?.name || '—'}</span>
                  </div>
                </div>

                <div className="fixture-market-preview">
                  {marketOptionsPreview(fixture.fixtureId)}
                </div>

                <div className="fixture-badges">
                  <Badge status={getPredictableBadge(fixture)} label="Predicción" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MarketOverview;
