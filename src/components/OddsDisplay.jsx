import React from 'react';

const OddsDisplay = ({ odds }) => {
  if (!odds) {
    return (
      <div className="card p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No odds data available
        </p>
      </div>
    );
  }

  const { home, draw, away, bookmaker = 'Best Odds' } = odds;

  return (
    <div className="card p-6 animate-fade-in-up animation-delay-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Betting Odds
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {bookmaker}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Home Odds */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Home
          </p>
          <div className="odds-box">
            <span className="font-mono">{home?.toFixed(2) || '-'}</span>
          </div>
          {home && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {((1 / home) * 100).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Draw Odds */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Draw
          </p>
          <div className="odds-box">
            <span className="font-mono">{draw?.toFixed(2) || '-'}</span>
          </div>
          {draw && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {((1 / draw) * 100).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Away Odds */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            Away
          </p>
          <div className="odds-box">
            <span className="font-mono">{away?.toFixed(2) || '-'}</span>
          </div>
          {away && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {((1 / away) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Note:</span> Odds are subject to change.
          Always verify with your bookmaker before placing bets.
        </p>
      </div>
    </div>
  );
};

export default OddsDisplay;
