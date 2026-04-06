const BADGE_MAP = {
  available: { icon: '🟢', label: 'Disponible', tone: 'available' },
  restricted: { icon: '🔴', label: 'No incluido en plan', tone: 'restricted' },
  empty: { icon: '⚪', label: 'Sin datos', tone: 'empty' },
  success: { icon: '🟢', label: 'Disponible', tone: 'available' },
  error: { icon: '🔴', label: 'Error al cargar', tone: 'restricted' },
};

const Badge = ({ status = 'empty', label }) => {
  const preset = BADGE_MAP[status] ?? BADGE_MAP.empty;
  return (
    <span className={`fp-badge ${preset.tone}`}>
      <span aria-hidden="true">{preset.icon}</span> {label ?? preset.label}
    </span>
  );
};

export default Badge;
