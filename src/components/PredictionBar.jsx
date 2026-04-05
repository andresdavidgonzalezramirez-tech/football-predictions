import { calculateFairOdds, formatPercentage, getPercentageColor } from '../utils/oddsCalculator';
import './PredictionBar.css';

/**
 * PredictionBar Component
 * Displays a visual percentage bar with odds calculation
 *
 * @param {Object} props
 * @param {string} props.label - Label for the prediction (e.g., "Home Win")
 * @param {number} props.percentage - Prediction percentage (0-100)
 * @param {string} props.color - Optional custom color
 * @returns {JSX.Element}
 */
const PredictionBar = ({ label, percentage, color }) => {
  const odds = calculateFairOdds(percentage);
  const colorClass = color || getPercentageColor(percentage);
  const displayPercentage = percentage || 0;

  return (
    <div className="prediction-bar-container">
      <div className="prediction-bar-header">
        <span className="prediction-label">{label}</span>
        <div className="prediction-stats">
          <span className="prediction-percentage">{formatPercentage(displayPercentage)}</span>
          <span className="prediction-odds">Odds: {odds}</span>
        </div>
      </div>
      <div className="prediction-bar-track">
        <div
          className={`prediction-bar-fill ${colorClass}`}
          style={{ width: `${displayPercentage}%` }}
          role="progressbar"
          aria-valuenow={displayPercentage}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`${label} prediction: ${displayPercentage}%`}
        />
      </div>
    </div>
  );
};

export default PredictionBar;
