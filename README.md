# Football Predictions (Sportmonks-aligned)

Aplicación React + Vercel Functions alineada con Sportmonks Football API 3.0, con separación estricta entre:

- **Datos oficiales** (response Sportmonks)
- **Datos derivados** (aliases/view-model métricos de UI)

## Endpoints usados por pantalla

### Home (`/`)
- `GET /api/leagues`
- Proxy a `/v3/football/leagues`
- Includes ligeros: `country;upcoming.participants;upcoming.state;upcoming.metadata`

### Match Detail (`/match/:fixtureId`)
- `GET /api/fixtures?id={fixtureId}` → fixture context
- `GET /api/predictions?fixtureId={fixtureId}` → probabilities
- `GET /api/value-bets?fixtureId={fixtureId}` → value bets
- `GET /api/odds?fixtureId={fixtureId}&bookmakerId={bookmakerId}` → odds

### Market Overview (`/market`)
- `GET /api/leagues` para contexto base de fixtures
- `GET /api/value-bets` para oportunidades globales
- `GET /api/predictions?fixtureId={fixtureId}` para probabilities por fixture

## Contrato de datos: oficial vs derivado

| Campo UI | Origen | Tipo |
|---|---|---|
| `predictable` | `fixture.metadata.predictable` | Oficial |
| `apiProbability` | endpoint `predictions/probabilities` | Oficial |
| `fairOdd` | `value-bets.predictions.fair_odd` | Oficial |
| `marketOdd` | `value-bets.predictions.odd` o endpoint odds | Oficial |
| `isValuePick` | alias desde `predictions.is_value` | Derivado (alias) |
| `suggestedStake` | alias desde `predictions.stake` | Derivado (alias) |
| `edgePercent` | cálculo interno | Derivado |
| `VALUE DETECTED` | copy UX | Derivado UX |

## Fórmula derivada documentada

`edgePercent = ((odd / fairOdd) - 1) * 100`

> `edgePercent` **no es campo oficial de Sportmonks**.

## Manejo de limitaciones

- Si falta add-on de predictions/value bets (403/402): mensaje específico.
- Si el fixture no es predictable: se informa sin tratarlo como error fatal.
- Si no hay value bets: empty state explícito.
- Si hay 429: error tipificado `RATE_LIMIT_EXCEEDED` y UX de reintento/backoff.
- Si faltan `odd`, `fair_odd` o bookmaker: se renderiza `No disponible`, sin suposiciones.

## Caché y protección de rate limit

- Caché local por endpoint/fixture (`cacheManager`) con TTL corto.
- Normalización centralizada para desacoplar UI del response bruto.
- Includes controlados para evitar payloads innecesarios en Home.

## Desarrollo

```bash
npm install
npm run dev
npm run build
npm run lint
```
