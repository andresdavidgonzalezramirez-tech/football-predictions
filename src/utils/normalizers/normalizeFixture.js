const normalizeParticipant = (participants = [], metaLocation) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    return { home: null, away: null };
  }

  const home = participants.find((p) => p.meta?.location === 'home' || p.location === 'home');
  const away = participants.find((p) => p.meta?.location === 'away' || p.location === 'away');

  return {
    home: home ?? participants[0] ?? null,
    away: away ?? participants[1] ?? null,
    sourceMetaLocation: metaLocation,
  };
};

export const normalizeFixture = (response) => {
  const fixture = response?.data ?? response;
  if (!fixture) return null;

  const participantsData = fixture.participants?.data ?? fixture.participants ?? [];
  const participants = normalizeParticipant(participantsData, 'participants.meta.location');

  const homeName = participants.home?.name ?? 'No disponible';
  const awayName = participants.away?.name ?? 'No disponible';

  return {
    fixtureId: fixture.id,
    sportmonksId: fixture.id,
    league: fixture.league?.data?.name ?? fixture.league?.name ?? 'No disponible',
    leagueId: fixture.league_id ?? fixture.league?.data?.id ?? fixture.league?.id ?? null,
    country: fixture.league?.data?.country?.data?.name
      ?? fixture.league?.country?.data?.name
      ?? fixture.league?.country?.name
      ?? fixture.country?.data?.name
      ?? fixture.country?.name
      ?? 'No disponible',
    kickoff: fixture.starting_at ?? fixture.starting_at_timestamp ?? null,
    timezone: fixture.starting_at_timezone ?? null,
    participants: {
      home: participants.home,
      away: participants.away,
    },
    teamsLabel: `${homeName} vs ${awayName}`,
    round: fixture.round?.data?.name ?? fixture.round?.name ?? null,
    stage: fixture.stage?.data?.name ?? fixture.stage?.name ?? null,
    season: fixture.season?.data?.name ?? fixture.season?.name ?? null,
    state: fixture.state?.data?.name ?? fixture.state?.name ?? 'No disponible',
    stateCode: fixture.state?.data?.state ?? fixture.state?.state ?? null,
    predictable: fixture.metadata?.predictable ?? null,
    metadata: fixture.metadata ?? null,
    hasOdds: fixture.has_odds ?? null,
    hasPremiumOdds: fixture.has_premium_odds ?? null,
    placeholder: fixture.placeholder ?? null,
    venue: fixture.venue?.data?.name ?? fixture.venue?.name ?? null,
    venueCity: fixture.venue?.data?.city_name ?? fixture.venue?.city_name ?? null,
    homeLogo: participants.home?.image_path ?? null,
    awayLogo: participants.away?.image_path ?? null,
  };
};

export default normalizeFixture;
