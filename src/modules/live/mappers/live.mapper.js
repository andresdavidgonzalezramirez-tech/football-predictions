import { mapFixture } from '../../fixtures/mappers/fixtures.mapper';

export const mapLiveScores = (response) => {
  const raw = response?.data ?? response ?? [];
  const fixtures = Array.isArray(raw) ? raw : [];

  return fixtures.map((fixture) => {
    const base = mapFixture(fixture);
    return {
      ...base,
      score: fixture.scores?.data ?? fixture.scores ?? [],
      period: fixture.periods?.data ?? fixture.periods ?? [],
      source: 'live',
    };
  }).filter(Boolean);
};
