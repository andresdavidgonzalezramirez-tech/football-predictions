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
    league: fixture.league?.data?.name ?? fixture.league?.name ?? 'No disponible',
    kickoff: fixture.starting_at ?? fixture.starting_at_timestamp ?? null,
    participants: {
      home: participants.home,
      away: participants.away,
    },
    teamsLabel: `${homeName} vs ${awayName}`,
    state: fixture.state?.data?.name ?? fixture.state?.name ?? 'No disponible',
    predictable: fixture.metadata?.predictable ?? null,
    venue: fixture.venue?.data?.name ?? fixture.venue?.name ?? null,
  };
};

export default normalizeFixture;
