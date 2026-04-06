import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaguesWithUpcoming } from '../services/sportsmonksApi';
import normalizeFixture from '../utils/normalizers/normalizeFixture';

const toDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatKickoff = (value) => {
  if (!value) return 'Hora N/D';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Hora N/D';
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const MarketOverview = () => {
  const [fixtures, setFixtures] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <main className="dashboard"><p>Cargando resumen de mercado…</p></main>;
  if (error) return <main className="dashboard"><p>{error}</p></main>;

  return (
    <main className="dashboard">
      <section className="general-list">
        <h2>Resumen de mercado — Partidos de hoy</h2>
        {todayFixtures.length === 0 ? (
          <p>No hay partidos programados para hoy.</p>
        ) : (
          <div className="today-fixtures-list">
            {todayFixtures.map((fixture) => (
              <article key={fixture.fixtureId} className="today-fixture-card">
                <div>
                  <h4>{fixture.teamsLabel}</h4>
                  <small>{fixture.league} • {fixture.country}</small>
                </div>
                <div>
                  <small>{formatKickoff(fixture.kickoff)}</small>
                </div>
                <div>
                  <Link to={`/match/${fixture.fixtureId}`}>Ver detalle</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MarketOverview;
