const safe = (value) => value ?? 'No disponible';

const PredictionDisplay = ({ probabilities }) => {
  if (!probabilities?.items?.length) {
    return (
      <div className="card p-6">
        <p>No hay probabilities disponibles para este fixture.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3>Probabilities (Sportmonks predictions/probabilities)</h3>
      <ul>
        {probabilities.items.map((market) => (
          <li key={`${market.typeId}-${market.marketCode}`}>
            <strong>{safe(market.marketName)}</strong> ({safe(market.marketCode)}) — Probability:{' '}
            {safe(market.probability)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PredictionDisplay;
