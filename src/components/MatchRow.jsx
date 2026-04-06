const MatchRow = ({ label, value, compact = false }) => {
  return (
    <div className={`fp-match-row ${compact ? 'compact' : ''}`}>
      <span className="fp-match-label">{label}</span>
      <span className="fp-match-value">{value}</span>
    </div>
  );
};

export default MatchRow;
