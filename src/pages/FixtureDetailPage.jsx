import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PredictionDisplay,
  OddsDisplay,
  ErrorState,
  Navbar
} from '../components';

const FixtureDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fixture, setFixture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call
    const fetchFixtureDetails = async () => {
      try {
        setLoading(true);
        // Replace with actual API call
        // const response = await fetch(`YOUR_API_ENDPOINT/${id}`);
        // const data = await response.json();

        // Mock data for demonstration
        setTimeout(() => {
          const mockFixture = {
            id: parseInt(id),
            homeTeam: {
              name: 'Manchester United',
              shortName: 'MUN',
              logo: null,
              form: 'W-W-D-L-W'
            },
            awayTeam: {
              name: 'Liverpool',
              shortName: 'LIV',
              logo: null,
              form: 'W-W-W-D-W'
            },
            league: 'Premier League',
            matchTime: 'Today, 19:45',
            venue: 'Old Trafford, Manchester',
            prediction: {
              homeWin: 65,
              draw: 20,
              awayWin: 15
            },
            odds: {
              home: 2.10,
              draw: 3.40,
              away: 3.80,
              bookmaker: 'Bet365'
            },
            status: 'upcoming',
            referee: 'Michael Oliver',
            temperature: '15°C',
            weather: 'Partly Cloudy'
          };

          setFixture(mockFixture);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFixtureDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar />
        <div className="container-custom section">
          <div className="animate-pulse space-y-6">
            <div className="skeleton h-12 w-64"></div>
            <div className="skeleton h-64 w-full rounded-xl"></div>
            <div className="skeleton h-48 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar />
        <div className="container-custom section">
          <ErrorState
            title="Failed to load fixture details"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
        <Navbar />
        <div className="container-custom section">
          <ErrorState
            title="Fixture not found"
            message="The requested fixture could not be found."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
      <Navbar />

      <main className="container-custom section">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary mb-6 animate-fade-in flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Fixtures</span>
        </button>

        {/* Match Header */}
        <div className="card p-6 md:p-8 mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <span className="badge-info">{fixture.league}</span>
            {fixture.status === 'live' && (
              <span className="badge-danger">
                <span className="status-live">LIVE</span>
              </span>
            )}
          </div>

          {/* Teams Display */}
          <div className="flex items-center justify-between mb-6">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 team-logo">
                  {fixture.homeTeam.logo ? (
                    <img
                      src={fixture.homeTeam.logo}
                      alt={fixture.homeTeam.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                      {fixture.homeTeam.shortName}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {fixture.homeTeam.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Form: {fixture.homeTeam.form}
              </p>
            </div>

            {/* VS and Time */}
            <div className="px-6 text-center">
              <div className="text-4xl font-bold text-gray-400 dark:text-gray-500 mb-2">
                VS
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {fixture.matchTime}
              </p>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 team-logo">
                  {fixture.awayTeam.logo ? (
                    <img
                      src={fixture.awayTeam.logo}
                      alt={fixture.awayTeam.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                      {fixture.awayTeam.shortName}
                    </span>
                  )}
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {fixture.awayTeam.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Form: {fixture.awayTeam.form}
              </p>
            </div>
          </div>

          {/* Match Info */}
          <div className="border-t border-gray-200 dark:border-dark-800 pt-4 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Venue</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {fixture.venue}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Referee</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {fixture.referee}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Weather</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {fixture.weather}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Temperature</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {fixture.temperature}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prediction and Odds Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PredictionDisplay prediction={fixture.prediction} />
          </div>

          <div className="lg:col-span-1">
            <OddsDisplay odds={fixture.odds} />

            {/* Additional Stats */}
            <div className="card p-6 mt-6 animate-fade-in-up animation-delay-400">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Head to Head</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    5-3-2
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Goals per Match</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    2.8
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Both Teams Score</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    78%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FixtureDetailPage;
