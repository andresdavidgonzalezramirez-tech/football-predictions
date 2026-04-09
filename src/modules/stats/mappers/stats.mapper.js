export const mapFixtureStats = (response) => {
  const fixture = response?.data ?? response;
  const stats = fixture?.statistics?.data ?? fixture?.statistics ?? [];

  return (Array.isArray(stats) ? stats : []).map((row) => ({
    participantId: row.participant_id ?? null,
    type: row.type?.data?.name ?? row.type?.name ?? 'Stat',
    value: row.data?.value ?? row.value ?? null,
    location: row.location ?? row.participant?.meta?.location ?? null,
  }));
};

export const mapFixtureEvents = (response) => {
  const fixture = response?.data ?? response;
  const events = fixture?.events?.data ?? fixture?.events ?? [];

  return (Array.isArray(events) ? events : []).map((event) => ({
    id: event.id,
    minute: event.minute ?? null,
    extraMinute: event.extra_minute ?? null,
    participantId: event.participant_id ?? null,
    playerName: event.player_name ?? event.player?.data?.display_name ?? 'Jugador',
    type: event.type?.data?.name ?? event.type?.name ?? 'Evento',
    result: event.result ?? null,
  }));
};
