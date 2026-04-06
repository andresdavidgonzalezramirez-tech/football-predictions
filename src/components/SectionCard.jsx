import Badge from './Badge';
import GlassCard from './GlassCard';

const SectionCard = ({ title, status = 'empty', children, helper }) => {
  return (
    <GlassCard className={`fp-section-card status-${status}`}>
      <header className="fp-section-header">
        <h3>{title}</h3>
        <Badge status={status} />
      </header>
      {helper ? <p className="fp-section-helper">{helper}</p> : null}
      <div className="fp-section-content">{children}</div>
    </GlassCard>
  );
};

export default SectionCard;
