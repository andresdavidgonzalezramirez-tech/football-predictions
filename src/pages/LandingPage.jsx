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

  // --- Manejo de Estados de Carga y Error ---

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

  // --- Cálculo de KPIs (Métricas) ---

  const totalFixtures = leagues.reduce((sum, league) => (
    sum + ((league?.upcoming?.data ?? league?.upcoming ?? []).length)
  ), 0);

  const leaguesWithCountry = leagues.filter((league) => league?.country?.name).length;

  const predictableFixtures = leagues.reduce((sum, league) => {
    const fixtures = league?.upcoming?.data ?? league?.upcoming ?? [];
    // Comprobación robusta en ambas ubicaciones posibles del flag 'predictable'
    const predictableCount = fixtures.filter((fixture) => 
      fixture?.metadata?.predictable === true || fixture?.predictable === true
    ).length;
    return sum + predictableCount;
  }, 0);

  // --- Renderizado Principal ---

  return (
    <main className="landing-page">
      <header className="page-header fp-glow">
        <h1>Predicción de fútbol</h1>
        <p>Vista limpia de ligas, partidos e indicadores clave.</p>
        
        <div className="landing-kpis">
          <span>Ligas: <strong>{leagues.length}</strong></span>
          <span>Partidos listados: <strong>{totalFixtures}</strong></span>
          <span>Ligas con país: <strong>{leaguesWithCountry}</strong></span>
          <span>Partidos predecibles: <strong>{predictableFixtures}</strong></span>
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