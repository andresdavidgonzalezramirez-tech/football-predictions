const normalizeParticipant = (participants = []) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    return { home: null, away: null };
  }

  const home = participants.find((p) => p.meta?.location === 'home' || p.location === 'home');
  const away = participants.find((p) => p.meta?.location === 'away' || p.location === 'away');

  return {
    home: home ?? participants[0] ?? null,
    away: away ?? participants[1] ?? null,
  };
};

export const mapFixture = (payload) => {
  const fixture = payload?.data ?? payload;
  if (!fixture) return null;

  const participantsData = fixture.participants?.data ?? fixture.participants ?? [];
  const participants = normalizeParticipant(participantsData);

  return {
    fixtureId: fixture.id,
    league: fixture.league?.data?.name ?? fixture.league?.name ?? 'No disponible',
    leagueId: fixture.league_id ?? fixture.league?.data?.id ?? fixture.league?.id ?? null,
    country: fixture.league?.data?.country?.data?.name
      ?? fixture.league?.country?.data?.name
      ?? fixture.league?.country?.name
      ?? fixture.country?.data?.name
      ?? fixture.country?.name
      ?? 'No disponible',
    kickoff: fixture.starting_at ?? fixture.starting_at_timestamp ?? null,
    state: fixture.state?.data?.name ?? fixture.state?.name ?? 'No disponible',
    predictable: fixture.metadata?.predictable ?? null,
    venue: fixture.venue?.data?.name ?? fixture.venue?.name ?? null,
    season: fixture.season?.data?.name ?? fixture.season?.name ?? null,
    round: fixture.round?.data?.name ?? fixture.round?.name ?? null,
    participants: {
      home: participants.home,
      away: participants.away,
    },
    homeLogo: participants.home?.image_path ?? null,
    awayLogo: participants.away?.image_path ?? null,
  };
};

export const mapLeagueFixtures = (leaguePayload) => {
  const fixturesRaw = leaguePayload?.upcoming?.data ?? leaguePayload?.upcoming ?? [];
  return (Array.isArray(fixturesRaw) ? fixturesRaw : []).map(mapFixture).filter(Boolean);
};
