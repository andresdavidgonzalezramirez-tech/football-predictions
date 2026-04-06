import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getFixtureById,
  getOddsByFixture,
  getProbabilitiesByFixture,
  getValueBetsByFixture,
} from '../services/sportsmonksApi';
import Badge from '../components/Badge';
import GlassCard from '../components/GlassCard';
import MatchRow from '../components/MatchRow';
import SectionCard from '../components/SectionCard';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeValueBets from '../utils/normalizers/normalizeValueBets';
import './MatchDetails.css';

// --- Funciones de utilidad ---
const toModuleState = (status, data = null, message = '') => ({ status, data, message });
const moduleStatusToBadge = (status) => (status === 'success' ? 'available' : status);
const TEAM_INFO_FALLBACK = 'Dato no disponible';

const OPTION_LABELS = {
  yes: 'Sí',
  no: 'No',
  equal: 'Igual',
  home: 'Local',
  away: 'Visitante',
  draw: 'Empate',
  over: 'Más',
  under: 'Menos',
  home_yes: 'Local Sí',
  away_yes: 'Visitante Sí',
};

const humanizeOption = (key) => OPTION_LABELS[key] || key.replaceAll('_', ' ');

const classifyMarketGroup = (code = '', name = '') => {
  const v = `${code} ${name}`.toLowerCase();
  if (v.includes('first-half') || v.includes('1st-half') || v.includes('opening')) return 'Inicio Más/Menos';
  if (v.includes('corner')) return 'Córners';
  if (v.includes('home-over-under') || v.includes('home_under') || v.includes('home over')) return 'Local Más/Menos';
  if (v.includes('away-over-under') || v.includes('away_under') || v.includes('away over')) return 'Fuera Más/Menos';
  if (v.includes('over-under') || v.includes('total')) return 'Más/Menos';
  if (v.includes('draw') || v.includes('result') || v.includes('double-chance')) return 'Resultado';
  return 'Otros mercados';
};

const getErrorState = (error) => {
  if (error.kind === 'plan_restricted') return toModuleState('restricted', null, 'No incluido en tu plan');
  if (error.kind === 'not_found') return toModuleState('empty', null, 'No hay datos');
  return toModuleState('error', null, 'Error al cargar');
};

const formatKickoff = (kickoff) => {
  if (!kickoff) return 'Fecha pendiente';
  const date = new Date(kickoff);
  return date.toLocaleString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatStateLabel = (state = '') => {
  const normalized = String(state).toLowerCase();
  if (normalized.includes('live') || normalized.includes('inplay')) return 'En vivo';
  if (normalized.includes('finish') || normalized.includes('final')) return 'Finalizado';
  return 'No iniciado';
};

const indicatorStatus = (value) => (value ? 'available' : 'empty');

const moduleMessage = (status) => {
  if (status === 'success') return 'Datos oficiales listos';
  if (status === 'restricted') return 'Disponible en plan premium';
  return 'Sin datos para este partido';
};

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [probabilities, setProbabilities] = useState(toModuleState('empty', []));
  const [valueBets, setValueBets] = useState(toModuleState('empty', []));
  const [odds, setOdds] = useState(toModuleState('empty', []));
  const [selectedMarketCategory, setSelectedMarketCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFatalError('');

      try {
        const fixtureResponse = await getFixtureById(fixtureId);
        setFixture(normalizeFixture(fixtureResponse));

        // Carga de módulos secundarios
        try {
          const res = await getProbabilitiesByFixture(fixtureId);
          const norm = normalizeProbabilities(res);
          setProbabilities(toModuleState(norm.items.length ? 'success' : 'empty', norm.items));
        } catch (e) { setProbabilities(getErrorState(e)); }

        try {
          const res = await getValueBetsByFixture(fixtureId);
          const norm = normalizeValueBets(res);
          setValueBets(toModuleState(norm.length ? 'success' : 'empty', norm));
        } catch (e) { setValueBets(getErrorState(e)); }

        try {
          const res = await getOddsByFixture(fixtureId);
          const items = res?.data ?? [];
          setOdds(toModuleState(items.length ? 'success' : 'empty', items));
        } catch (e) { setOdds(getErrorState(e)); }

      } catch (error) {
        setFatalError(error.message || 'Error al cargar partido');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fixtureId]);

  const groupedMarkets = useMemo(() => {
    const groups = {};
    (probabilities.data ?? []).forEach((market) => {
      const group = classifyMarketGroup(market.marketCode, market.marketName);
      groups[group] = groups[group] ?? [];
      groups[group].push(market);
    });
    return groups;
  }, [probabilities.data]);

  const marketCategories = useMemo(() => Object.keys(groupedMarkets), [groupedMarkets]);

  useEffect(() => {
    if (marketCategories.length > 0 && !marketCategories.includes(selectedMarketCategory)) {
      setSelectedMarketCategory(marketCategories[0]);
    }
  }, [marketCategories, selectedMarketCategory]);

  const groupedOdds = useMemo(() => {
    const groups = {};
    (odds.data ?? []).forEach((odd) => {
      const key = odd.market?.name || odd.market_description || `Mercado ${odd.market_id ?? ''}`;
      groups[key] = groups[key] ?? [];
      groups[key].push(odd);
    });
    return groups;
  }, [odds.data]);

  const topValueBet = useMemo(
    () => (valueBets.data ?? []).find((item) => item.isValuePick) ?? null,
    [valueBets.data],
  );

  if (loading) {
    return (
      <main className="match-screen">
        <div className="fp-detail-skeleton hero" />
        <div className="fp-detail-skeleton panel" />
      </main>
    );
  }

  if (fatalError || !fixture) {
    return (
      <main className="match-screen">
        <GlassCard>
          <p>{fatalError || 'No se pudo abrir el partido'}</p>
          <Link to="/" className="fp-back-link">Volver al inicio</Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="match-screen">
      <Link to="/" className="fp-back-link">← Volver</Link>

      {/* Hero Section */}
      <GlassCard className="fp-hero">
        <div className="fp-hero-top">
          <span>📅 {formatKickoff(fixture.kickoff)}</span>
          <span>🏆 {fixture.league} · {fixture.country}</span>
          <span>🏟 {fixture.venue || 'N/D'}</span>
        </div>
        <div className="fp-teams-hero">
          <div className="fp-team-block">
            <img src={fixture.homeLogo || '/vite.svg'} alt="Home" />
            <h1>{fixture.participants?.home?.name || 'Local'}</h1>
          </div>
          <div className="fp-vs">VS</div>
          <div className="fp-team-block">
            <img src={fixture.awayLogo || '/vite.svg'} alt="Away" />
            <h1>{fixture.participants?.away?.name || 'Visitante'}</h1>
          </div>
        </div>
        <div className="fp-scoreboard-main">
          <div className="fp-score-pill">{formatStateLabel(fixture.state)}</div>
          <div className="fp-score-block">
            <span>{fixture.participants?.home?.name}</span>
            <strong>— : —</strong>
            <span>{fixture.participants?.away?.name}</span>
          </div>
        </div>
      </GlassCard>

      {/* Layout de 2 Columnas estilo Sportsbook */}
      <section className="fp-event-layout">
        
        {/* Main Content: Mercados */}
        <div className="fp-event-main">
          
          <SectionCard title="Probabilidades" status={moduleStatusToBadge(probabilities.status)} helper={moduleMessage(probabilities.status)}>
            {probabilities.status === 'success' && (
              <div className="fp-market-groups">
                <div className="fp-market-tabs">
                  {marketCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`fp-market-tab ${selectedMarketCategory === cat ? 'active' : ''}`}
                      onClick={() => setSelectedMarketCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="fp-market-group">
                  <h4>{selectedMarketCategory}</h4>
                  {(groupedMarkets[selectedMarketCategory] ?? []).map((item) => (
                    <div key={item.id} className="fp-market-card">
                      <div className="fp-market-head">
                        <strong>{item.marketName}</strong>
                        <span>{item.marketCode}</span>
                      </div>
                      <div className="fp-market-options">
                        {item.options.map((opt) => (
                          <button key={opt.key} className="fp-odd-pill">
                            <span>{humanizeOption(opt.key)}</span>
                            <strong>{opt.value}%</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cuotas Reales" status={moduleStatusToBadge(odds.status)}>
            {odds.status === 'success' && (
              <div className="fp-market-groups">
                {Object.entries(groupedOdds).map(([marketName, marketOdds]) => (
                  <div key={marketName} className="fp-market-card">
                    <div className="fp-market-head"><strong>{marketName}</strong></div>
                    <div className="fp-market-options">
                      {marketOdds.slice(0, 9).map((odd) => (
                        <button key={odd.id} className="fp-odd-pill">
                          <span>{odd.label || odd.original_label}</span>
                          <strong>{odd.value}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar: Información Adicional */}
        <aside className="fp-event-side">
          <SectionCard title="Value Bets" status={moduleStatusToBadge(valueBets.status)}>
            {valueBets.status === 'success' && topValueBet ? (
              <div className="fp-value-pick">
                <MatchRow label="Selección" value={topValueBet.bet} compact />
                <MatchRow label="Stake" value={`${topValueBet.suggestedStake}%`} compact />
              </div>
            ) : <p className="fp-module-empty">Sin picks de valor</p>}
          </SectionCard>

          <GlassCard className="fp-indicators">
            <h3>Indicadores</h3>
            <div className="fp-indicator-list">
              <Badge status={indicatorStatus(fixture.hasOdds)} label="Odds" />
              <Badge status={indicatorStatus(fixture.hasPremiumOdds)} label="Premium" />
              <Badge status={fixture.predictable ? 'available' : 'empty'} label="Predicción" />
            </div>
          </GlassCard>

          <GlassCard>
            <h3>Resumen</h3>
            <div className="fp-context-grid">
              <MatchRow label="Liga" value={fixture.league} compact />
              <MatchRow label="Estadio" value={fixture.venue || 'N/D'} compact />
              <MatchRow label="Fixture ID" value={fixture.fixtureId} compact />
              <MatchRow label="Estado" value={fixture.state} compact />
            </div>
          </GlassCard>
        </aside>

      </section>
    </main>
  );
};

export default MatchDetails;