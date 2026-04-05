import React from 'react';
import { calculateFairOdds } from '../utils/oddsCalculator';

const PredictionDisplay = ({ prediction, bookmakerOdds = null }) => {
  if (!prediction) {
    return (
      <div className="card p-6">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No prediction data available
        </p>
      </div>
    );
  }

  const { homeWin, draw, awayWin } = prediction;
  const predictions = [
    { label: 'Home Win', value: homeWin, color: 'success' },
    { label: 'Draw', value: draw, color: 'warning' },
    { label: 'Away Win', value: awayWin, color: 'danger' }
  ];

  // Find the highest prediction
  const maxPrediction = predictions.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  );

  const getConfidenceLevel = (value) => {
    if (value >= 70) return 'Very High';
    if (value >= 60) return 'High';
    if (value >= 50) return 'Medium';
    if (value >= 40) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="space-y-6">
      {/* Main Prediction Display - SportMonks Style */}
      <div className="prediction-display animate-scale-in">
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-wide text-white/80 mb-2">
            AI Match Prediction
          </p>
          <div className="flex items-baseline space-x-3 mb-2">
            <span className="text-6xl font-bold">{maxPrediction.value}</span>
            <span className="text-2xl">%</span>
          </div>
          <div className="text-xl font-semibold mb-3">{maxPrediction.label}</div>
          <div className="text-sm text-white/90">
            Confidence: {getConfidenceLevel(maxPrediction.value)}
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="card p-6 animate-fade-in-up animation-delay-100">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Full Prediction Breakdown
        </h3>

        <div className="space-y-4">
          {/* Home Win */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Home Win
                </span>
                {homeWin === maxPrediction.value && (
                  <span className="badge-success text-xs">Predicted</span>
                )}
              </div>
              <span className="text-sm font-bold text-success-600 dark:text-success-400">
                {homeWin}%
              </span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill-success"
                style={{ width: `${homeWin}%` }}
              ></div>
            </div>
          </div>

          {/* Draw */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Draw
                </span>
                {draw === maxPrediction.value && (
                  <span className="badge-warning text-xs">Predicted</span>
                )}
              </div>
              <span className="text-sm font-bold text-warning-600 dark:text-warning-400">
                {draw}%
              </span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill-warning"
                style={{ width: `${draw}%` }}
              ></div>
            </div>
          </div>

          {/* Away Win */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Away Win
                </span>
                {awayWin === maxPrediction.value && (
                  <span className="badge-danger text-xs">Predicted</span>
                )}
              </div>
              <span className="text-sm font-bold text-danger-600 dark:text-danger-400">
                {awayWin}%
              </span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill-danger"
                style={{ width: `${awayWin}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Summary */}
      <div className="grid grid-cols-3 gap-4 animate-fade-in-up animation-delay-200">
        <div className="card p-4 text-center hover:shadow-card-hover transition-shadow duration-300">
          <div className="text-3xl font-bold text-success-600 dark:text-success-400 mb-1">
            {homeWin}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Home
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Fair Odds: <span className="font-semibold font-mono">{calculateFairOdds(homeWin)}</span>
          </div>
          {bookmakerOdds?.home && (
            <div className="text-sm text-gray-800 dark:text-gray-200">
              Bet365: <span className="font-bold font-mono text-success-600 dark:text-success-400">{bookmakerOdds.home.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="card p-4 text-center hover:shadow-card-hover transition-shadow duration-300">
          <div className="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-1">
            {draw}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Draw
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Fair Odds: <span className="font-semibold font-mono">{calculateFairOdds(draw)}</span>
          </div>
          {bookmakerOdds?.draw && (
            <div className="text-sm text-gray-800 dark:text-gray-200">
              Bet365: <span className="font-bold font-mono text-warning-600 dark:text-warning-400">{bookmakerOdds.draw.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="card p-4 text-center hover:shadow-card-hover transition-shadow duration-300">
          <div className="text-3xl font-bold text-danger-600 dark:text-danger-400 mb-1">
            {awayWin}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Away
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            Fair Odds: <span className="font-semibold font-mono">{calculateFairOdds(awayWin)}</span>
          </div>
          {bookmakerOdds?.away && (
            <div className="text-sm text-gray-800 dark:text-gray-200">
              Bet365: <span className="font-bold font-mono text-danger-600 dark:text-danger-400">{bookmakerOdds.away.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionDisplay;
