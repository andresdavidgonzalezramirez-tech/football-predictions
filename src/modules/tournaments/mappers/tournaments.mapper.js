export const mapTournaments = (response) => {
  const raw = response?.data ?? response ?? [];
  const leagues = Array.isArray(raw) ? raw : [];

  return leagues.map((league) => ({
    id: league.id,
    name: league.name,
    type: league.type ?? null,
    country: league.country?.data?.name ?? league.country?.name ?? null,
    logo: league.image_path ?? null,
    source: 'tournaments',
  }));
};
