import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLeaguesWithUpcoming } from '../services/sportsmonksApi';
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

  if (loading) return <div className="landing-page"><p>Loading leagues…</p></div>;
  if (error) return <div className="landing-page"><p>{error}</p></div>;

  return (
    <div className="landing-page">
      <header className="page-header">
        <h1>Football Predictions</h1>
        <p>Datos oficiales Sportmonks + capa de normalización</p>
        <Link to="/market" className="retry-button">Abrir Market Overview</Link>
      </header>

      <div className="leagues-container">
        {leagues.map((league) => (
          <LeagueCard key={league.id} league={league} />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;
