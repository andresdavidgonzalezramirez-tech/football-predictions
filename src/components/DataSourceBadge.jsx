const DataSourceBadge = ({ label, source }) => (
  <span className="data-source-badge" title={source || 'No disponible'}>
    {label}: {source || 'No disponible'}
  </span>
);

export default DataSourceBadge;
