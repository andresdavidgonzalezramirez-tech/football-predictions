# Arquitectura modular Sportmonks (separación estricta)

## Capas

1. **API client/services** (`src/services/sportmonks/*`)
   - Solo llamadas HTTP al backend `/api/*`.
   - Sin lógica de presentación.

2. **Mappers/normalizers** (`src/modules/*/mappers/*`)
   - Transforman respuesta cruda de Sportmonks a modelos internos estables.
   - La UI nunca consume respuesta cruda.

3. **Domain modules** (`src/modules/*`)
   - `fixtures`, `predictions`, `odds`, `live`, `stats`, `tournaments`, `teams`, `standings`.
   - Cada dominio encapsula `services + mappers + selectors`.

4. **UI/components/pages** (`src/pages`, `src/components`)
   - Consume únicamente modelos normalizados.
   - **Predictions UI** (`/predictions`) y **Odds UI** (`/odds`) están separadas.

## Endpoints proxy por módulo

- `predictions` → `/api/predictions` → `GET /v3/football/predictions/probabilities[/fixtures/{fixtureId}]`
- `odds` → `/api/odds` → `GET /v3/football/odds/pre-match/fixtures/{fixtureId}/bookmakers/{bookmakerId}`
- `fixtures` → `/api/fixtures` → `GET /v3/football/fixtures/{id}` o `/fixtures/date/{date}`
- `live` → `/api/live` → `GET /v3/football/livescores/latest`
- `stats` → `/api/stats` + `/api/events` → includes sobre fixture
- `tournaments` → `/api/tournaments` → `GET /v3/football/leagues`
- `teams` → `/api/teams` → `GET /v3/football/teams`
- `standings` → `/api/standings` → `GET /v3/football/standings/seasons/{seasonId}`

## Reglas de separación críticas

- Predictions y Odds tienen **mappers, servicios y vistas diferentes**.
- Un contenedor (ej. `MatchDetails`) puede mostrar ambos, pero en bloques separados.
- No se comparten tipos ambiguos ni componentes de dominio principal.
