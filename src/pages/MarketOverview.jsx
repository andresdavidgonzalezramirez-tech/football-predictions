import { useEffect, useMemo, useState } from 'react';
import {
  getGlobalValueBets,
  getLeaguesWithUpcoming,
  getProbabilitiesByFixture,
} from '../services/sportsmonksApi';
import normalizeFixture from '../utils/normalizers/normalizeFixture';
import normalizeProbabilities from '../utils/normalizers/normalizeProbabilities';
import normalizeValueBets from '../utils/normalizers/normalizeValueBets';
import buildGeneralMarketItem from '../utils/viewModels/buildGeneralMarketItem';
import ValueAlertCard from '../components/ValueAlertCard';
import GeneralMarketRow from '../components/GeneralMarketRow';
import ValueEmptyState from '../components/ValueEmptyState';

const MarketOverview = () => {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [leaguesResponse, valueBetsResponse] = await Promise.all([
          getLeaguesWithUpcoming(),
          getGlobalValueBets({ per_page: 50 }),
        ]);

        const rawFixtures = (leaguesResponse?.data ?? []).flatMap(
          (league) => league?.upcoming?.data ?? league?.upcoming ?? [],
        );
        const normalizedFixtures = rawFixtures.map(normalizeFixture).filter(Boolean);
        const valueBets = normalizeValueBets(valueBetsResponse);

        const fixtureIds = normalizedFixtures.slice(0, 10).map((fixture) => fixture.fixtureId);
        const probsByFixture = {};

        await Promise.all(
          fixtureIds.map(async (fixtureId) => {
            try {
              const response = await getProbabilitiesByFixture(fixtureId);
              probsByFixture[fixtureId] = normalizeProbabilities(response);
            } catch {
              probsByFixture[fixtureId] = { items: [] };
            }
          }),
        );

        const merged = normalizedFixtures.map((fixture) => {
          const valueBet = valueBets.find((candidate) => candidate.fixtureId === fixture.fixtureId) || null;
          return buildGeneralMarketItem({
            fixture,
            probabilities: probsByFixture[fixture.fixtureId] ?? { items: [] },
            valueBet,
          });
        });

        setItems(merged);
      } catch (err) {
        setError(err.message ?? 'No se pudo construir el dashboard de mercado.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const elitePicks = useMemo(() => items.filter((item) => item.isValuePick), [items]);

  if (loading) return <main className="dashboard"><p>Cargando Market Overview…</p></main>;
  if (error) return <main className="dashboard"><p>{error}</p></main>;

  return (
    <main className="dashboard">
      <section className="premium-section">
        <h2>Premium / Elite</h2>
        {elitePicks.length === 0 ? (
          <ValueEmptyState message="No hay oportunidades elite actualmente." />
        ) : (
          elitePicks.map((item) => <ValueAlertCard key={`elite-${item.fixtureId}`} item={item} />)
        )}
      </section>

      <section className="general-list">
        <h2>Listado general</h2>
        {items.map((item) => (
          <GeneralMarketRow key={`general-${item.fixtureId}`} item={item} />
        ))}
      </section>
    </main>
  );
};

export default MarketOverview;
