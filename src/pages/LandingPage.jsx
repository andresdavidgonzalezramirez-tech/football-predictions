import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaguesWithUpcoming } from '../services/sportsmonksApi';
import GlassCard from '../components/GlassCard';
import LeagueCard from '../components/LeagueCard';
import './LandingPage.css';

const LandingPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const response = await getLeaguesWithUpcoming();
        setLeagues(response?.data ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <main className="landing-page">
        <div className="landing-skeleton hero" />
        <div className="landing-skeleton row" />
        <div className="landing-skeleton row" />
      </main>
    );
  }
  if (error) {
    return (
      <main className="landing-page">
        <GlassCard>
          <h2>Error al cargar ligas</h2>
          <p>{error}</p>
        </GlassCard>
      </main>
    );
  }
  if (!leagues.length) {
    return (
      <main className="landing-page">
        <GlassCard>
          <h2>Sin ligas disponibles</h2>
          <p>No recibimos ligas para mostrar en este momento.</p>
        </GlassCard>
      </main>
    );
  }

  const totalFixtures = leagues.reduce((sum, league) => (
    sum + ((league?.upcoming?.data ?? league?.upcoming ?? []).length)
  ), 0);
  const leaguesWithCountry = leagues.filter((league) => league?.country?.name).length;
  const predictableFixtures = leagues.reduce((sum, league) => {
    const fixtures = league?.upcoming?.data ?? league?.upcoming ?? [];
    const predictableCount = fixtures.filter((fixture) => fixture?.metadata?.predictable === true).length;
    return sum + predictableCount;
  }, 0);

  return (
    <main className="landing-page">
      <header className="page-header fp-glow">
        <h1>Predicción de fútbol</h1>
        <p>Vista limpia de ligas, partidos e indicadores clave.</p>
        <div className="landing-kpis">
          <span>Ligas: {leagues.length}</span>
          <span>Partidos listados: {totalFixtures}</span>
          <span>Ligas con país: {leaguesWithCountry}</span>
          <span>Partidos predecibles: {predictableFixtures}</span>
        </div>
        <Link to="/market" className="retry-button">Abrir resumen de mercado</Link>
      </header>

      <div className="leagues-container">
        {leagues.map((league) => (
          <LeagueCard key={league.id} league={league} />
        ))}
      </div>
    </main>
  );
};

export default LandingPage;
