import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNormalizedLeaguesWithFixtures } from '../modules/fixtures/services/fixtures.service';
import { getOddsByFixture } from '../modules/odds/services/odds.service';
import { groupOddsByMarket } from '../modules/odds/selectors/groupOddsByMarket';

const DEFAULT_BOOKMAKER_ID = 2;

const toDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const OddsOverview = () => {
  const [fixtures, setFixtures] = useState([]);
  const [oddsByFixture, setOddsByFixture] = useState({});
  const [statusByFixture, setStatusByFixture] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const leagues = await getNormalizedLeaguesWithFixtures();
        const safeLeagues = Array.isArray(leagues) ? leagues : [];
        const allFixtures = safeLeagues.flatMap((league) => league.upcomingFixtures ?? []);
        setFixtures(allFixtures);
      } catch (loadError) {
        setError(loadError.message ?? 'No se pudo cargar el listado para odds.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const todayFixtures = useMemo(
    () => fixtures.filter((fixture) => toDateKey(fixture.kickoff) === todayKey).slice(0, 10),
    [fixtures, todayKey],
  );

  useEffect(() => {
    if (!todayFixtures.length) return;

    let cancelled = false;

    const loadOdds = async () => {
      const nextOdds = {};
      const nextStatus = {};

      await Promise.all(todayFixtures.map(async (fixture) => {
        try {
          const oddsRows = await getOddsByFixture({ fixtureId: fixture.fixtureId, bookmakerId: DEFAULT_BOOKMAKER_ID });
          nextOdds[fixture.fixtureId] = oddsRows;
          nextStatus[fixture.fixtureId] = oddsRows.length > 0 ? 'available' : 'empty';
        } catch (oddsError) {
          nextOdds[fixture.fixtureId] = [];
          nextStatus[fixture.fixtureId] = oddsError.kind === 'plan_restricted' ? 'restricted' : 'empty';
        }
      }));

      if (!cancelled) {
        setOddsByFixture((prev) => ({ ...prev, ...nextOdds }));
        setStatusByFixture((prev) => ({ ...prev, ...nextStatus }));
      }
    };

    loadOdds();
    return () => { cancelled = true; };
  }, [todayFixtures]);

  if (loading) return <main className="dashboard"><p>Cargando odds UI…</p></main>;
  if (error) return <main className="dashboard"><p>{error}</p></main>;

  return (
    <main className="dashboard">
      <section className="general-list">
        <Link to="/" className="fixtures-count" style={{ display: 'inline-flex', marginBottom: 12 }}>
          ← Volver al inicio
        </Link>
        <h2>Odds UI — Pre-match (bookmaker {DEFAULT_BOOKMAKER_ID})</h2>
        {todayFixtures.map((fixture) => {
          const grouped = groupOddsByMarket(oddsByFixture[fixture.fixtureId] ?? []);
          const firstMarketName = Object.keys(grouped)[0];
          const firstMarketRows = firstMarketName ? grouped[firstMarketName] : [];

          return (
            <div key={fixture.fixtureId} className="league-card" style={{ marginBottom: 10 }}>
              <h4>{fixture.participants?.home?.name} vs {fixture.participants?.away?.name}</h4>
              {statusByFixture[fixture.fixtureId] === 'restricted' && <p>No incluido en tu plan.</p>}
              {statusByFixture[fixture.fixtureId] === 'empty' && <p>Sin odds disponibles.</p>}
              {!!firstMarketRows.length && (
                <div>
                  <strong>{firstMarketName}</strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {firstMarketRows.slice(0, 5).map((row) => (
                      <span key={row.id} className="fixture-market-pill">
                        {row.selection}: {row.value ?? '—'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </main>
  );
};

export default OddsOverview;
