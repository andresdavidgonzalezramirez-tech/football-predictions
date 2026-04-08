export const mapTeams = (response) => {
  const raw = response?.data ?? response ?? [];
  const teams = Array.isArray(raw) ? raw : [];

  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    shortCode: team.short_code ?? null,
    countryId: team.country_id ?? null,
    logo: team.image_path ?? null,
    founded: team.founded ?? null,
    source: 'teams',
  }));
};
