import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getFixtureById,
  getProbabilitiesByFixture,
  getOddsByFixture,
} from '../services/sportsmonksApi';
import GlassCard from '../components/GlassCard';
import MatchRow from '../components/MatchRow';
import SectionCard from '../components/SectionCard';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import {
  formatProbabilityValue,
  translateMarketTitle,
} from '../utils/marketTranslations';
import {
  resolveOddsMarketTitle,
  resolveOddsSelectionLabel,
} from '../utils/oddsPresentation';
import './MatchDetails.css';

// --- Funciones de utilidad ---
const toModuleState = (status, data = null, message = '') => ({ status, data, message });
const moduleStatusToBadge = (status) => (status === 'success' ? 'available' : status);
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

const moduleMessage = (status) => {
  if (status === 'success') return 'Datos oficiales listos';
  if (status === 'restricted') return 'Disponible en plan premium';
  return 'Sin datos para este partido';
};

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [probabilities, setProbabilities] = useState(toModuleState('empty', []));
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

        // Carga de Probabilidades
        try {
          const resProbs = await getProbabilitiesByFixture(fixtureId);
          const normProbs = normalizeProbabilities(resProbs);
          setProbabilities(toModuleState(normProbs.items.length ? 'success' : 'empty', normProbs.items));
        } catch (e) { setProbabilities(getErrorState(e)); }

        // Carga de Cuotas Reales (Odds)
        try {
          const resOdds = await getOddsByFixture(fixtureId);
          const itemsOdds = resOdds?.data ?? [];
          setOdds(toModuleState(itemsOdds.length ? 'success' : 'empty', itemsOdds));
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
      const group = market.category || 'Otros mercados';
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

      <GlassCard className="fp-hero">
        <div className="fp-hero-top">
          <span>📅 {formatKickoff(fixture.kickoff)}</span>
          <span>🏆 {fixture.league} · {fixture.country}</span>
          <span>🏟 {fixture.venue || 'N/D'}</span>
        </div>
        <div className="fp-teams-hero">
          <div className="fp-team-block">
            <img src={fixture.homeLogo || '/vite.svg'} alt="Home" />
            <h1 translate="no">{fixture.participants?.home?.name || 'Local'}</h1>
          </div>
          <div className="fp-vs">VS</div>
          <div className="fp-team-block">
            <img src={fixture.awayLogo || '/vite.svg'} alt="Away" />
            <h1 translate="no">{fixture.participants?.away?.name || 'Visitante'}</h1>
          </div>
        </div>
        <div className="fp-scoreboard-main">
          <div className="fp-score-pill">{formatStateLabel(fixture.state)}</div>
          <div className="fp-score-block">
            <span translate="no">{fixture.participants?.home?.name}</span>
            <strong>— : —</strong>
            <span translate="no">{fixture.participants?.away?.name}</span>
          </div>
        </div>
      </GlassCard>

      <section className="fp-event-layout">
        <div className="fp-event-main">
          {/* Módulo de Probabilidades algorítmicas */}
          <SectionCard title="Probabilidades API" status={moduleStatusToBadge(probabilities.status)} helper={moduleMessage(probabilities.status)}>
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
                        <strong>{item.displayName || translateMarketTitle(item)}</strong>
                      </div>
                      <div className="fp-market-options">
                        {item.options.map((opt) => (
                          <button key={`${item.id}-${opt.rawKey || opt.key}`} className="fp-odd-pill">
                            <span>{opt.label}</span>
                            <strong>{formatProbabilityValue(opt.value)}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Módulo de Cuotas de Mercado (Odds) */}
          <SectionCard title="Cuotas Reales (Odds)" status={moduleStatusToBadge(odds.status)}>
            {odds.status === 'success' && (
              <div className="fp-market-groups">
                {Object.entries(groupedOdds).map(([marketName, marketOdds]) => (
                  <div key={marketName} className="fp-market-card">
                    <div className="fp-market-head">
                      <strong translate="no">{resolveOddsMarketTitle(marketName)}</strong>
                    </div>
                    <div className="fp-market-options">
                      {marketOdds.map((odd) => (
                        <button key={odd.id} className="fp-odd-pill">
                          <span translate="no">{resolveOddsSelectionLabel(odd, {
                            homeTeam: fixture.participants?.home?.name,
                            awayTeam: fixture.participants?.away?.name,
                          })}</span>
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

        <aside className="fp-event-side">
          <GlassCard>
            <h3>Resumen</h3>
            <div className="fp-context-grid">
              <MatchRow label="Estado" value={formatStateLabel(fixture.state)} compact />
              <MatchRow label="Temporada" value={fixture.season || 'N/D'} compact />
              <MatchRow label="Ronda" value={fixture.round || 'N/D'} compact />
              <MatchRow label="ID Partido" value={fixture.fixtureId || 'N/D'} compact />
            </div>
          </GlassCard>
        </aside>
      </section>
    </main>
  );
};

export default MatchDetails;