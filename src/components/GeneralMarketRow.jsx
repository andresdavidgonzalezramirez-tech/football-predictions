import { Link } from 'react-router-dom';

const safe = (value) => value ?? 'No disponible';

const GeneralMarketRow = ({ item }) => {
  return (
    <div className="general-market-row">
      <div>
        <h4>{safe(item.teamsLabel)}</h4>
        <small>{safe(item.league)} • {safe(item.state)}</small>
      </div>
      <div>
        <small>Predictable: {item.predictable === null ? 'No disponible' : String(item.predictable)}</small>
      </div>
      <div>
        <small>Market Odd: {safe(item.marketOdd)}</small>
      </div>
      <div>
        <small>Fair Odd: {safe(item.fairOdd)}</small>
      </div>
      <div>
        <Link to={`/match/${item.fixtureId}`}>Detalle</Link>
      </div>
    </div>
  );
};

export default GeneralMarketRow;
