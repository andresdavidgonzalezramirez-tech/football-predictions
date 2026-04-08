import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import MatchRow from '../components/MatchRow';
import SectionCard from '../components/SectionCard';
import { getNormalizedFixtureById } from '../modules/fixtures/services/fixtures.service';
import { getPredictionsByFixture } from '../modules/predictions/services/predictions.service';
import { getOddsByFixture } from '../modules/odds/services/odds.service';
import { getEventsByFixture, getStatsByFixture } from '../modules/stats/services/stats.service';
import { groupPredictionsByCategory } from '../modules/predictions/selectors/groupPredictionsByCategory';
import { groupOddsByMarket } from '../modules/odds/selectors/groupOddsByMarket';
import { formatProbabilityValue } from '../utils/marketTranslations';
import './MatchDetails.css';

const DEFAULT_BOOKMAKER_ID = 2;
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

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [predictions, setPredictions] = useState(toModuleState('empty', []));
  const [odds, setOdds] = useState(toModuleState('empty', []));
  const [stats, setStats] = useState(toModuleState('empty', []));
  const [events, setEvents] = useState(toModuleState('empty', []));
  const [selectedMarketCategory, setSelectedMarketCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFatalError('');

      try {
        const normalizedFixture = await getNormalizedFixtureById(fixtureId);
        setFixture(normalizedFixture);

        try {
          const predictionRows = await getPredictionsByFixture(fixtureId);
          setPredictions(toModuleState(predictionRows.length ? 'success' : 'empty', predictionRows));
        } catch (error) { setPredictions(getErrorState(error)); }

        try {
          const oddRows = await getOddsByFixture({ fixtureId, bookmakerId: DEFAULT_BOOKMAKER_ID });
          setOdds(toModuleState(oddRows.length ? 'success' : 'empty', oddRows));
        } catch (error) { setOdds(getErrorState(error)); }

        try {
          const statsRows = await getStatsByFixture(fixtureId);
          setStats(toModuleState(statsRows.length ? 'success' : 'empty', statsRows));
        } catch (error) { setStats(getErrorState(error)); }

        try {
          const eventRows = await getEventsByFixture(fixtureId);
          setEvents(toModuleState(eventRows.length ? 'success' : 'empty', eventRows));
        } catch (error) { setEvents(getErrorState(error)); }
      } catch (error) {
        setFatalError(error.message || 'Error al cargar partido');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fixtureId]);

  const groupedPredictionMarkets = useMemo(
    () => groupPredictionsByCategory(predictions.data ?? []),
    [predictions.data],
  );
  const groupedOddsMarkets = useMemo(() => groupOddsByMarket(odds.data ?? []), [odds.data]);

  const marketCategories = useMemo(() => Object.keys(groupedPredictionMarkets), [groupedPredictionMarkets]);

  useEffect(() => {
    if (marketCategories.length > 0 && !marketCategories.includes(selectedMarketCategory)) {
      setSelectedMarketCategory(marketCategories[0]);
    }
  }, [marketCategories, selectedMarketCategory]);

  if (loading) {
    return <main className="match-screen"><div className="fp-detail-skeleton hero" /><div className="fp-detail-skeleton panel" /></main>;
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
          <div className="fp-team-block"><img src={fixture.homeLogo || '/vite.svg'} alt="Home" /><h1>{fixture.participants?.home?.name || 'Local'}</h1></div>
          <div className="fp-vs">VS</div>
          <div className="fp-team-block"><img src={fixture.awayLogo || '/vite.svg'} alt="Away" /><h1>{fixture.participants?.away?.name || 'Visitante'}</h1></div>
        </div>
      </GlassCard>

      <section className="fp-event-layout">
        <div className="fp-event-main">
          <SectionCard title="Predictions" status={moduleStatusToBadge(predictions.status)} helper="Predicciones/probabilidades del modelo Sportmonks.">
            {predictions.status === 'success' && (
              <div className="fp-market-groups">
                <div className="fp-market-tabs">
                  {marketCategories.map((cat) => (
                    <button key={cat} type="button" className={`fp-market-tab ${selectedMarketCategory === cat ? 'active' : ''}`} onClick={() => setSelectedMarketCategory(cat)}>{cat}</button>
                  ))}
                </div>
                {(groupedPredictionMarkets[selectedMarketCategory] ?? []).map((item) => (
                  <div key={item.id} className="fp-market-card">
                    <div className="fp-market-head"><strong>{item.displayName}</strong></div>
                    <div className="fp-market-options">
                      {item.options.map((opt) => (
                        <button key={`${item.id}-${opt.rawKey || opt.key}`} className="fp-odd-pill"><span>{opt.label}</span><strong>{formatProbabilityValue(opt.value)}</strong></button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Odds UI" status={moduleStatusToBadge(odds.status)} helper={`Cuotas pre-match por bookmaker ${DEFAULT_BOOKMAKER_ID}.`}>
            {odds.status === 'success' && Object.entries(groupedOddsMarkets).slice(0, 3).map(([marketName, selections]) => (
              <div key={marketName} className="fp-market-card">
                <div className="fp-market-head"><strong>{marketName}</strong></div>
                <div className="fp-market-options">
                  {selections.slice(0, 5).map((row) => (
                    <button key={row.id} className="fp-odd-pill"><span>{row.selection}</span><strong>{row.value ?? '—'}</strong></button>
                  ))}
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Eventos" status={moduleStatusToBadge(events.status)} helper="Eventos del partido normalizados.">
            {(events.data ?? []).slice(0, 6).map((event) => <MatchRow key={event.id} label={`${event.minute ?? '-'}' ${event.type}`} value={event.playerName} compact />)}
          </SectionCard>

          <SectionCard title="Estadísticas" status={moduleStatusToBadge(stats.status)} helper="Estadísticas de fixture normalizadas.">
            {(stats.data ?? []).slice(0, 6).map((row, idx) => <MatchRow key={`${row.type}-${idx}`} label={row.type} value={String(row.value ?? '—')} compact />)}
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
