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

const MatchDetails = () => {
  const { fixtureId } = useParams();
  const [fixture, setFixture] = useState(null);
  const [probabilities, setProbabilities] = useState({ items: [] });
  const [valueBets, setValueBets] = useState([]);
  const [odds, setOdds] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const nextErrors = [];

      try {
        const fixtureResponse = await getFixtureById(fixtureId);
        const normalizedFixture = normalizeFixture(fixtureResponse);
        setFixture(normalizedFixture);

        try {
          const probResponse = await getProbabilitiesByFixture(fixtureId);
          setProbabilities(normalizeProbabilities(probResponse));
        } catch (error) {
          nextErrors.push(error.message);
        }

        try {
          const valueResponse = await getValueBetsByFixture(fixtureId);
          setValueBets(normalizeValueBets(valueResponse));
        } catch (error) {
          nextErrors.push(error.message);
        }

        try {
          const oddsResponse = await getOddsByFixture(fixtureId);
          setOdds(oddsResponse?.data ?? []);
        } catch (error) {
          nextErrors.push(error.message);
        }
      } catch (error) {
        nextErrors.push(error.message);
      }

      setErrors(nextErrors);
      setLoading(false);
    };

    load();
  }, [fixtureId]);

  const topValuePick = useMemo(
    () => valueBets.find((valueBet) => valueBet.isValuePick) ?? null,
    [valueBets],
  );

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
      <p>League: {fixture.league}</p>
      <p>Kickoff: {fixture.kickoff ?? 'No disponible'}</p>
      <p>State: {fixture.state}</p>
      <p>Predictability (metadata.predictable): {fixture.predictable === null ? 'No disponible' : String(fixture.predictable)}</p>

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
        <PredictionDisplay probabilities={probabilities} />
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h2>Value Bets</h2>
        {topValuePick ? (
          <ValueAlertCard
            item={{
              ...fixture,
              ...topValuePick,
              sources: {
                fixture: 'fixtures',
                probabilities: 'predictions/probabilities',
                valueBets: 'predictions/value-bets',
              },
              apiProbability: probabilities.items[0]?.probability ?? null,
            }}
          />
        ) : (
          <p>No hay value bet disponible para este fixture.</p>
        )}
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h2>Odds</h2>
        {odds.length === 0 ? <p>No disponible</p> : <p>Odds records: {odds.length}</p>}
      </section>
    </div>
  );
};

export default MatchDetails;
