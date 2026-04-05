const ValueEmptyState = ({ message = 'No hay value bets disponibles para este rango.' }) => {
  return (
    <div className="value-empty-state">
      <h3>Sin picks Elite</h3>
      <p>{message}</p>
    </div>
  );
};

export default ValueEmptyState;
