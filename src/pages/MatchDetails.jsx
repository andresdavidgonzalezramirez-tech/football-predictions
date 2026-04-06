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
  if (v.includes('corner')) return 'Córners';
  if (v.includes('home-over-under') || v.includes('home over/under')) return 'Local';
  if (v.includes('away-over-under') || v.includes('away over/under')) return 'Visitante';
  if (v.includes('over-under') || v.includes('total')) return 'Totales';
  if (v.includes('draw') || v.includes('result') || v.includes('double-chance')) return 'Resultado';
  return 'Especiales';
};

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

  const topValueBet = useMemo(
    () => (valueBets.data ?? []).find((item) => item.isValuePick) ?? null,
    [valueBets.data],
  );

  const groupedMarkets = useMemo(() => {
    const groups = {};
    (probabilities.data ?? []).forEach((market) => {
      const group = classifyMarketGroup(market.marketCode, market.marketName);
      groups[group] = groups[group] ?? [];
      groups[group].push(market);
    });
    return groups;
  }, [probabilities.data]);

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
            <img src={fixture.homeLogo || '/vite.svg'} alt={fixture.participants?.home?.name} />
            <h1>{fixture.participants?.home?.name || 'Local'}</h1>
          </div>
          <div className="fp-vs">VS</div>
          <div className="fp-team-block">
            <img src={fixture.awayLogo || '/vite.svg'} alt={fixture.participants?.away?.name} />
            <h1>{fixture.participants?.away?.name || 'Visitante'}</h1>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="fp-scoreboard">
        <div className="fp-scoreboard-main">
          <div className="fp-score-pill">{formatStateLabel(fixture.state)}</div>
          <div className="fp-score-block">
            <span>{fixture.participants?.home?.name}</span>
            <strong>— : —</strong>
            <span>{fixture.participants?.away?.name}</span>
          </div>
        </div>
      </GlassCard>

      <section className="fp-info-grid">
        <GlassCard><MatchRow label="Estado" value={formatStateLabel(fixture.state)} /></GlassCard>
        <GlassCard><MatchRow label="Predictable" value={fixture.predictable ? 'Sí' : 'No'} /></GlassCard>
        <GlassCard>
          <MatchRow 
            label="Odds / Premium" 
            value={`${fixture.hasOdds ? 'Disponibles' : 'Sin odds'} · ${fixture.hasPremiumOdds ? 'Premium' : 'Base'}`} 
          />
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

      <section className="fp-modules-grid">
        <SectionCard title="Probabilidades" status={moduleStatusToBadge(probabilities.status)} helper={moduleMessage(probabilities.status)}>
          {probabilities.status === 'success' && (
            <div className="fp-market-groups">
              {Object.entries(groupedMarkets).map(([group, markets]) => (
                <div key={group} className="fp-market-group">
                  <h4>{group}</h4>
                  {markets.map((item) => (
                    <div key={item.id} className="fp-market-card">
                      <div className="fp-market-head">
                        <strong>{item.marketName}</strong>
                      </div>
                      <div className="fp-market-options">
                        {item.options.map((opt) => (
                          <div key={opt.key} className="fp-odd-pill">
                            <span>{humanizeOption(opt.key)}</span>
                            <strong>{opt.value}%</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Value Bets" status={moduleStatusToBadge(valueBets.status)} helper={moduleMessage(valueBets.status)}>
          {valueBets.status === 'success' && (
            topValueBet ? (
              <div className="fp-value-pick">
                <MatchRow label="Selección" value={topValueBet.bet} compact />
                <MatchRow label="Bookmaker" value={topValueBet.bookmaker} compact />
                <MatchRow label="Stake" value={`${topValueBet.suggestedStake}%`} compact />
              </div>
            ) : <p className="fp-module-empty">Sin picks disponibles</p>
          )}
        </SectionCard>

        <SectionCard title="Odds" status={moduleStatusToBadge(odds.status)} helper={moduleMessage(odds.status)}>
          {odds.status === 'success' && (
            <div className="fp-market-groups">
              {Object.entries(groupedOdds).map(([marketName, marketOdds]) => (
                <div key={marketName} className="fp-market-card">
                  <div className="fp-market-head"><strong>{marketName}</strong></div>
                  <div className="fp-market-options">
                    {marketOdds.slice(0, 6).map((odd) => (
                      <div key={odd.id} className="fp-odd-pill">
                        <span>{odd.label}</span>
                        <strong>{odd.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>

      <GlassCard>
        <h3>Resumen Final</h3>
        <div className="fp-summary-grid">
          <MatchRow label="Ciudad" value={fixture.venueCity || 'Por confirmar'} compact />
          <MatchRow label="Fixture ID" value={fixture.fixtureId} compact />
          <MatchRow label="Estado Original" value={fixture.state} compact />
        </div>
      </GlassCard>
    </main>
  );
};

export default MatchDetails;