export const mapStandings = (response) => {
  const raw = response?.data ?? response ?? [];
  const rows = Array.isArray(raw) ? raw : [];

  return rows.map((row) => ({
    id: row.id,
    position: row.position ?? null,
    participantId: row.participant_id ?? null,
    teamName: row.participant?.data?.name ?? row.team_name ?? 'Equipo',
    points: row.points ?? null,
    gamesPlayed: row.games_played ?? null,
    won: row.won ?? null,
    draw: row.draw ?? null,
    lost: row.lost ?? null,
    source: 'standings',
  }));
};
