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

const toModuleState = (status, data = null, message = '') => ({ status, data, message });
const moduleStatusToBadge = (status) => (status === 'success' ? 'available' : status);
const TEAM_INFO_FALLBACK = 'Dato no disponible';

const getErrorState = (error) => {
  if (error.kind === 'plan_restricted') return toModuleState('restricted', null, 'No incluido en tu plan');
  if (error.kind === 'not_found') return toModuleState('empty', null, 'No hay datos para este partido');
  return toModuleState('error', null, 'Error al cargar');
};

const formatKickoff = (kickoff) => {
  if (!kickoff) return 'Fecha pendiente';
  const date = new Date(kickoff);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const indicatorStatus = (value) => (value ? 'available' : 'empty');

const moduleMessage = (status) => {
  if (status === 'success') return 'Datos oficiales listos para analizar';
  if (status === 'restricted') return 'Disponible en plan premium';
  if (status === 'error') return 'Error técnico';
  return 'Sin datos para este partido';
};

const formatStateLabel = (state = '') => {
  const normalized = String(state).toLowerCase();
  if (normalized.includes('live') || normalized.includes('inplay')) return 'En vivo';
  if (normalized.includes('finish') || normalized.includes('final') || normalized.includes('ft')) return 'Finalizado';
  return 'No iniciado';
};

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [probabilities, setProbabilities] = useState(toModuleState('empty', []));
  const [valueBets, setValueBets] = useState(toModuleState('empty', []));
  const [odds, setOdds] = useState(toModuleState('empty', []));
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFatalError('');

      try {
        const fixtureResponse = await getFixtureById(fixtureId);
        setFixture(normalizeFixture(fixtureResponse));
      } catch (error) {
        setFatalError(error.message || 'Error al cargar partido');
        setLoading(false);
        return;
      }

      try {
        const response = await getProbabilitiesByFixture(fixtureId);
        const normalized = normalizeProbabilities(response);
        setProbabilities(toModuleState(normalized.items.length ? 'success' : 'empty', normalized.items));
      } catch (error) {
        setProbabilities(getErrorState(error));
      }

      try {
        const response = await getValueBetsByFixture(fixtureId);
        const normalized = normalizeValueBets(response);
        setValueBets(toModuleState(normalized.length ? 'success' : 'empty', normalized));
      } catch (error) {
        setValueBets(getErrorState(error));
      }

      try {
        const response = await getOddsByFixture(fixtureId);
        const items = response?.data ?? [];
        setOdds(toModuleState(items.length ? 'success' : 'empty', items));
      } catch (error) {
        setOdds(getErrorState(error));
      }

      setLoading(false);
    };

    load();
  }, [fixtureId]);

  const topValueBet = useMemo(
    () => (valueBets.data ?? []).find((item) => item.isValuePick) ?? null,
    [valueBets.data],
  );

  if (loading) {
    return (
      <main className="match-screen">
        <div className="fp-detail-skeleton hero" />
        <div className="fp-detail-skeleton panel" />
        <div className="fp-detail-skeleton modules" />
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
          <span>🏟 {fixture.venue || 'Estadio por confirmar'}</span>
        </div>
        <div className="fp-teams-hero">
          <div className="fp-team-block">
            <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name || 'Equipo local'} />
            <h1>{fixture.participants?.home?.name || 'Equipo local'}</h1>
          </div>
          <div className="fp-vs">VS</div>
          <div className="fp-team-block">
            <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name || 'Equipo visitante'} />
            <h1>{fixture.participants?.away?.name || 'Equipo visitante'}</h1>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="fp-scoreboard">
        <div className="fp-scoreboard-main">
          <div className="fp-score-pill">{formatStateLabel(fixture.state)}</div>
          <div className="fp-score-block">
            <span>{fixture.participants?.home?.name || 'Local'}</span>
            <strong>— : —</strong>
            <span>{fixture.participants?.away?.name || 'Visitante'}</span>
          </div>
        </div>
      </GlassCard>

      <section className="fp-info-grid">
        <GlassCard>
          <MatchRow label="Estado" value={formatStateLabel(fixture.state)} />
        </GlassCard>
        <GlassCard>
          <MatchRow label="Predictable" value={fixture.predictable ? 'Sí' : 'No'} />
        </GlassCard>
        <GlassCard>
          <MatchRow label="Odds / Premium" value={`${fixture.hasOdds ? 'Disponibles' : 'Sin odds'} · ${fixture.hasPremiumOdds ? 'Premium' : 'Base'}`} />
        </GlassCard>
      </section>

      <GlassCard className="fp-indicators">
        <h3>Indicadores</h3>
        <div className="fp-indicator-list">
          <Badge status={indicatorStatus(fixture.hasOdds)} label="Odds disponibles" />
          <Badge status={indicatorStatus(fixture.hasPremiumOdds)} label="Premium odds" />
          <Badge status={fixture.predictable ? 'available' : 'empty'} label={fixture.predictable ? 'Predictible' : 'No predictible'} />
        </div>
      </GlassCard>

      <GlassCard>
        <h3>Contexto del partido</h3>
        <div className="fp-context-grid">
          <MatchRow label="Temporada" value={fixture.season || 'Dato no disponible'} compact />
          <MatchRow label="Jornada / Round" value={fixture.round || 'Dato no disponible'} compact />
          <MatchRow label="Etapa" value={fixture.stage || 'Dato no disponible'} compact />
          <MatchRow label="Venue + ciudad" value={`${fixture.venue || 'Dato no disponible'}${fixture.venueCity ? ` · ${fixture.venueCity}` : ''}`} compact />
          <MatchRow label="Fixture ID" value={fixture.fixtureId || '—'} compact />
          <MatchRow label="League ID" value={fixture.leagueId || '—'} compact />
          <MatchRow label="Código de estado" value={fixture.stateCode || 'Información no proporcionada por la API'} compact />
          <MatchRow label="Placeholder API" value={fixture.placeholder === null ? 'Información no proporcionada por la API' : (fixture.placeholder ? 'Sí' : 'No')} compact />
        </div>
      </GlassCard>

      <GlassCard>
        <h3>Equipos y contexto real</h3>
        <div className="fp-team-panels">
          <article className="fp-team-panel">
            <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name || 'Equipo local'} />
            <div>
              <h4>{fixture.participants?.home?.name || 'Equipo local'}</h4>
              <p>{fixture.participants?.home?.country?.name || fixture.country || TEAM_INFO_FALLBACK}</p>
              <p>Posición: {fixture.participants?.home?.meta?.position || 'Dato no disponible'}</p>
              <p>ID participante: {fixture.participants?.home?.id || 'Información no proporcionada por la API'}</p>
            </div>
          </article>
          <article className="fp-team-panel">
            <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name || 'Equipo visitante'} />
            <div>
              <h4>{fixture.participants?.away?.name || 'Equipo visitante'}</h4>
              <p>{fixture.participants?.away?.country?.name || fixture.country || TEAM_INFO_FALLBACK}</p>
              <p>Posición: {fixture.participants?.away?.meta?.position || 'Dato no disponible'}</p>
              <p>ID participante: {fixture.participants?.away?.id || 'Información no proporcionada por la API'}</p>
            </div>
          </article>
        </div>
      </GlassCard>

      <GlassCard>
        <h3>Metadata del fixture</h3>
        {fixture.metadata && Object.keys(fixture.metadata).length > 0 ? (
          <div className="fp-metadata-grid">
            {Object.entries(fixture.metadata).slice(0, 8).map(([key, value]) => (
              <MatchRow key={key} label={key.replaceAll('_', ' ')} value={String(value)} compact />
            ))}
          </div>
        ) : (
          <p className="fp-module-empty">Información no proporcionada por la API</p>
        )}
      </GlassCard>

      {(probabilities.status === 'restricted' && valueBets.status === 'restricted') ? (
        <GlassCard className="fp-analysis-locked">
          <h3>Análisis disponible</h3>
          <p>Tu plan actual cubre datos base en tiempo real. El análisis avanzado está disponible en plan premium.</p>
        </GlassCard>
      ) : null}

      <section className="fp-modules-grid">
        <SectionCard title="Probabilidades" status={moduleStatusToBadge(probabilities.status)} helper={moduleMessage(probabilities.status)}>
          {probabilities.status === 'success' ? (
            <div className="fp-list">
              {probabilities.data.slice(0, 6).map((item) => (
                <MatchRow
                  key={`${item.typeId}-${item.marketCode}`}
                  label={item.marketName || 'Mercado'}
                  value={item.probability ? `${item.probability}%` : 'Dato base'}
                  compact
                />
              ))}
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Value Bets" status={moduleStatusToBadge(valueBets.status)} helper={moduleMessage(valueBets.status)}>
          {valueBets.status === 'success' ? (
            topValueBet ? (
              <div className="fp-value-pick">
                <MatchRow label="Selección" value={topValueBet.bet || 'Pick disponible'} compact />
                <MatchRow label="Bookmaker" value={topValueBet.bookmaker || 'Bookmaker oficial'} compact />
                <MatchRow label="Stake sugerido" value={topValueBet.suggestedStake ? `${topValueBet.suggestedStake}%` : 'Modelo Sportmonks'} compact />
              </div>
            ) : (
              <p className="fp-module-empty">Sin picks para este partido</p>
            )
          ) : null}
        </SectionCard>

        <SectionCard title="Odds" status={moduleStatusToBadge(odds.status)} helper={moduleMessage(odds.status)}>
          {odds.status === 'success' ? (
            <div className="fp-list">
              {odds.data.slice(0, 5).map((odd) => (
                <MatchRow
                  key={odd.id}
                  label={`${odd.market?.name || odd.market_description || 'Mercado'} · ${odd.label || odd.original_label || 'Pick'}`}
                  value={odd.value || 'Cuota'}
                  compact
                />
              ))}
            </div>
          ) : null}
        </SectionCard>
      </section>

      <GlassCard>
        <h3>Resumen del partido</h3>
        <div className="fp-summary-grid">
          <MatchRow label="Local" value={fixture.participants?.home?.name || 'Equipo local'} compact />
          <MatchRow label="Visitante" value={fixture.participants?.away?.name || 'Equipo visitante'} compact />
          <MatchRow label="Ciudad" value={fixture.venueCity || 'Ciudad por confirmar'} compact />
          <MatchRow label="Fecha" value={formatKickoff(fixture.kickoff)} compact />
          <MatchRow label="Estado" value={fixture.state || 'Pendiente'} compact />
        </div>
      </GlassCard>
    </main>
  );
};

export default MatchDetails;
