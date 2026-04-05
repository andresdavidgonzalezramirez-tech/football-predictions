import { useState, useEffect } from 'react';
import { getLeaguesWithUpcoming } from '../services/sportsmonksApi';
import LeagueCard from '../components/LeagueCard';
import './LandingPage.css';

/**
 * LandingPage Component
 * Displays all leagues with their upcoming fixtures
 * Fetches data from SportMonks API on mount
 */
const LandingPage = () => {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaguesWithUpcoming();

      // Filter leagues that have upcoming fixtures
      const leaguesWithFixtures = data.data?.filter(
        league => league.upcoming && league.upcoming.length > 0
      ) || [];

      setLeagues(leaguesWithFixtures);
    } catch (err) {
      setError('Failed to load leagues. Please check your API token and try again.');
      console.error('Error fetching leagues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter leagues based on search
  const filteredLeagues = leagues.filter(league => {
    const leagueName = league.name?.toLowerCase() || '';
    const countryName = league.country?.name?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return leagueName.includes(search) || countryName.includes(search);
  });

  if (loading) {
    return (
      <div className="landing-page">
        <div className="loading-container">
          <div className="spinner" role="status" aria-label="Loading">
            <span className="sr-only">Loading...</span>
          </div>
          <p>Loading fixtures...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchLeagues} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <header className="page-header">
        <h1>Football Predictions</h1>
        <p>Upcoming fixtures with AI-powered predictions</p>
      </header>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search leagues or countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          aria-label="Search leagues"
        />
        <span className="search-icon">🔍</span>
      </div>

      {filteredLeagues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No fixtures found</h3>
          <p>
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'No upcoming fixtures available at the moment'}
          </p>
        </div>
      ) : (
        <div className="leagues-container">
          {filteredLeagues.map((league) => (
            <LeagueCard key={league.id} league={league} />
          ))}
        </div>
      )}

      <footer className="page-footer">
        <p>Powered by SportMonks API</p>
      </footer>
    </div>
  );
};

export default LandingPage;
