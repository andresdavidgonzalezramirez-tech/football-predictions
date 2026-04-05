import { formatPercentage } from '../utils/oddsCalculator';
import DataSourceBadge from './DataSourceBadge';

const safe = (value) => value ?? 'No disponible';

const ValueAlertCard = ({ item }) => {
  if (!item?.isValuePick) return null;

  const predictabilityValue = item.predictable === null || item.predictable === undefined
    ? null
    : Number(item.predictable);

  return (
    <article className="value-card active">
      <div className="badge">VALUE DETECTED</div>
      <div className="teams">{safe(item.teamsLabel)}</div>

      <div className="stats-grid">
        <div className="stat-item">
          <span>Predictability</span>
          <div className="progress-bar">
            <div
              className="fill"
              style={{ width: `${Math.max(0, Math.min(100, predictabilityValue ?? 0))}%` }}
            >
              {predictabilityValue === null ? 'No disponible' : `${predictabilityValue}%`}
            </div>
          </div>
        </div>

        <div className="stat-item highlight">
          <span>Suggested Stake</span>
          <strong>{safe(item.suggestedStake)}{item.suggestedStake !== null ? '%' : ''}</strong>
        </div>

        <div className="stat-item">
          <span>Edge (Ventaja)</span>
          <span className="text-green">
            {item.edgePercent === null ? 'No disponible' : `${item.edgePercent > 0 ? '+' : ''}${formatPercentage(item.edgePercent)}`}
          </span>
        </div>
      </div>

      <div className="footer">
        <small>
          API Probability: {safe(item.apiProbability)} | Market Odd: {safe(item.marketOdd)} | Fair Odd: {safe(item.fairOdd)} | Bookmaker: {safe(item.bookmaker)}
        </small>
      </div>

      <div className="value-card-badges">
        <DataSourceBadge label="Probabilities" source={item.sources?.probabilities} />
        <DataSourceBadge label="Value Bets" source={item.sources?.valueBets} />
      </div>
    </article>
  );
};

export default ValueAlertCard;
