import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getFixtureById,
  getOddsByFixture,
  getProbabilitiesByFixture,
  getValueBetsByFixture,
} from '../services/sportsmonksApi';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeValueBets from '../utils/normalizers/normalizeValueBets';
import PredictionDisplay from '../components/PredictionDisplay';
import ValueAlertCard from '../components/ValueAlertCard';

const asModuleState = (status, payload = {}) => ({ status, ...payload });

const getModuleUi = (moduleState, emptyMessage) => {
  if (moduleState.status === 'restricted') {
    return <p>Este módulo no está incluido en tu plan actual de Sportmonks.</p>;
  }
  if (moduleState.status === 'error') {
    return <p>Error consultando módulo: {moduleState.message}</p>;
  }
  if (moduleState.status === 'empty') {
    return <p>{emptyMessage}</p>;
  }
  return null;
};

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [probabilitiesModule, setProbabilitiesModule] = useState(asModuleState('idle', { data: { items: [] } }));
  const [valueBetsModule, setValueBetsModule] = useState(asModuleState('idle', { data: [] }));
  const [oddsModule, setOddsModule] = useState(asModuleState('idle', { data: [] }));
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const nextErrors = [];
      setProbabilitiesModule(asModuleState('idle', { data: { items: [] } }));
      setValueBetsModule(asModuleState('idle', { data: [] }));
      setOddsModule(asModuleState('idle', { data: [] }));

      try {
        const fixtureResponse = await getFixtureById(fixtureId);
        const normalizedFixture = normalizeFixture(fixtureResponse);
        setFixture(normalizedFixture);

        try {
          const probResponse = await getProbabilitiesByFixture(fixtureId);
          const normalized = normalizeProbabilities(probResponse);
          if (!normalized.items.length) {
            setProbabilitiesModule(asModuleState('empty', { data: normalized }));
          } else {
            setProbabilitiesModule(asModuleState('success', { data: normalized }));
          }
        } catch (error) {
          if (error.kind === 'plan_restricted') {
            setProbabilitiesModule(asModuleState('restricted', { message: error.message }));
          } else if (error.kind === 'not_found') {
            setProbabilitiesModule(asModuleState('empty', { message: error.message, data: { items: [] } }));
          } else {
            setProbabilitiesModule(asModuleState('error', { message: error.message }));
            nextErrors.push(`Probabilities: ${error.message}`);
          }
        }

        try {
          const valueResponse = await getValueBetsByFixture(fixtureId);
          const normalized = normalizeValueBets(valueResponse);
          if (!normalized.length) {
            setValueBetsModule(asModuleState('empty', { data: normalized }));
          } else {
            setValueBetsModule(asModuleState('success', { data: normalized }));
          }
        } catch (error) {
          if (error.kind === 'plan_restricted') {
            setValueBetsModule(asModuleState('restricted', { message: error.message }));
          } else if (error.kind === 'not_found') {
            setValueBetsModule(asModuleState('empty', { message: error.message, data: [] }));
          } else {
            setValueBetsModule(asModuleState('error', { message: error.message }));
            nextErrors.push(`Value bets: ${error.message}`);
          }
        }

        try {
          const oddsResponse = await getOddsByFixture(fixtureId);
          const oddsData = oddsResponse?.data ?? [];
          if (!oddsData.length) {
            setOddsModule(asModuleState('empty', { data: [] }));
          } else {
            setOddsModule(asModuleState('success', { data: oddsData }));
          }
        } catch (error) {
          if (error.kind === 'plan_restricted') {
            setOddsModule(asModuleState('restricted', { message: error.message }));
          } else if (error.kind === 'not_found') {
            setOddsModule(asModuleState('empty', { message: error.message, data: [] }));
          } else {
            setOddsModule(asModuleState('error', { message: error.message }));
            nextErrors.push(`Odds: ${error.message}`);
          }
        }
      } catch (error) {
        nextErrors.push(error.message);
      }

      setErrors(nextErrors);
      setLoading(false);
    };

    load();
  }, [fixtureId]);

  const topValuePick = useMemo(() => {
    const valueBets = valueBetsModule.data ?? [];
    return valueBets.find((valueBet) => valueBet.isValuePick) ?? null;
  }, [valueBetsModule]);

  if (loading) return <div className="match-details-page"><p>Cargando detalle…</p></div>;

  if (!fixture) {
    return (
      <div className="match-details-page">
        <p>No se encontró el fixture.</p>
        <Link to="/">Volver</Link>
      </div>
    );
  }

  return (
    <div className="match-details-page">
      <Link to="/">← Volver</Link>
      <h1>{fixture.teamsLabel}</h1>
      <p><strong>Fixture ID:</strong> {fixture.fixtureId}</p>
      <p><strong>Liga:</strong> {fixture.league} ({fixture.country})</p>
      <p><strong>Fecha/hora:</strong> {fixture.kickoff ?? 'No disponible'} {fixture.timezone ? `(${fixture.timezone})` : ''}</p>
      <p><strong>Estado:</strong> {fixture.state}</p>
      <p><strong>Season:</strong> {fixture.season ?? 'No disponible'} | <strong>Round:</strong> {fixture.round ?? 'No disponible'} | <strong>Stage:</strong> {fixture.stage ?? 'No disponible'}</p>
      <p><strong>Venue:</strong> {fixture.venue ?? 'No disponible'}{fixture.venueCity ? `, ${fixture.venueCity}` : ''}</p>
      <p><strong>metadata.predictable:</strong> {fixture.predictable === null ? 'No disponible' : String(fixture.predictable)}</p>
      <p><strong>Indicadores:</strong> has_odds={String(fixture.hasOdds)} | has_premium_odds={String(fixture.hasPremiumOdds)} | placeholder={fixture.placeholder ?? 'No disponible'}</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div>
          <strong>Home:</strong> {fixture.participants?.home?.name ?? 'No disponible'}
          {fixture.homeLogo ? <div><img src={fixture.homeLogo} alt="home logo" width="40" /></div> : null}
        </div>
        <div>
          <strong>Away:</strong> {fixture.participants?.away?.name ?? 'No disponible'}
          {fixture.awayLogo ? <div><img src={fixture.awayLogo} alt="away logo" width="40" /></div> : null}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card p-4" style={{ marginTop: '1rem' }}>
          <h3>Advertencias de integración</h3>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <section style={{ marginTop: '1rem' }}>
        <h2>Probabilities</h2>
        {probabilitiesModule.status === 'success'
          ? <PredictionDisplay probabilities={probabilitiesModule.data} />
          : getModuleUi(probabilitiesModule, 'No hay probabilidades disponibles para este partido.')}
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h2>Value Bets</h2>
        {valueBetsModule.status === 'success' && topValuePick ? (
          <ValueAlertCard
            item={{
              ...fixture,
              ...topValuePick,
              sources: {
                fixture: 'fixtures',
                probabilities: 'predictions/probabilities',
                valueBets: 'predictions/value-bets',
              },
              apiProbability: probabilitiesModule.data?.items?.[0]?.probability ?? null,
            }}
          />
        ) : valueBetsModule.status === 'success' ? (
          <p>No hay apuestas de valor disponibles para este partido.</p>
        ) : (
          getModuleUi(valueBetsModule, 'No hay apuestas de valor disponibles para este partido.')
        )}
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h2>Odds</h2>
        {oddsModule.status === 'success' ? (
          <div className="card p-6">
            <p>Registros de odds: {oddsModule.data.length}</p>
            <ul>
              {oddsModule.data.slice(0, 5).map((odd) => (
                <li key={odd.id}>
                  {odd.market?.name ?? odd.market_description ?? 'Mercado'} - {odd.label ?? odd.original_label ?? 'Selección'}: {odd.value ?? 'N/D'}
                </li>
              ))}
            </ul>
          </div>
        ) : getModuleUi(oddsModule, 'No hay odds disponibles para este partido.')}
      </section>
    </div>
  );
};

export default MatchDetails;
