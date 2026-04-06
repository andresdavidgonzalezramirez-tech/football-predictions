const GlassCard = ({ children, className = '' }) => {
  return (
    <section className={`fp-glass-card ${className}`.trim()}>
      {children}
    </section>
  );
};

export default GlassCard;
