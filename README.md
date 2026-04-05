# Football Predictions (Sportmonks aligned)

Aplicación web React que consume **Sportmonks Football API 3.0** mediante un backend proxy interno (`/api/*`) para mostrar:

- Probabilities oficiales de Sportmonks.
- Value bets oficiales de Sportmonks.
- Priorización visual de oportunidades premium (arriba).
- Mercado general completo (abajo), sin ocultarlo.

> Este repositorio **no recalcula** el modelo oficial de Sportmonks (`stake`, `fair_odd`, `is_value`, `probabilities`). Solo consume, normaliza para UI y renderiza.

---

## 1) Dependencia con Sportmonks

La app depende de un token válido de Sportmonks y del acceso a endpoints del bundle correspondiente (Odds & Predictions según plan):

- `GET /v3/football/leagues`
- `GET /v3/football/fixtures/{id}`
- `GET /v3/football/predictions/probabilities`
- `GET /v3/football/predictions/probabilities/fixtures/{fixtureId}`
- `GET /v3/football/predictions/value-bets`
- `GET /v3/football/predictions/value-bets/fixtures/{fixtureId}`
- `GET /v3/football/odds/pre-match/fixtures/{fixtureId}/bookmakers/{bookmakerId}`
- `GET /v3/my/usage` (Core API, no `football` prefix)

Base URL usada por el proxy:

- Football endpoints: `https://api.sportmonks.com/v3/football`
- Usage endpoint (`/my/usage`): `https://api.sportmonks.com/v3`

---

## 2) Variables de entorno

Crear `.env` local desde `.env.example`.

| Variable | Requerida | Descripción |
|---|---|---|
| `SPORTMONKS_API_TOKEN` | Sí | Token server-side para llamadas proxy a Sportmonks. |
| `PORT` | No | Puerto del servidor Node (default `3000`). |

### `.env.example`

```env
SPORTMONKS_API_TOKEN=your_sportmonks_token_here
PORT=3000
```

---

## 3) Scripts disponibles

```bash
npm run dev        # Frontend Vite en local
npm run build      # Build de producción (dist/)
npm run start      # Arranque servidor Node + proxy API + estáticos
npm run lint       # Lint
npm run preview    # Vista previa de Vite
```

> En producción (Docker/EasyPanel) se usa `npm run build` + `npm run start`.

---

## 4) Docker (producción)

Este proyecto está dockerizado con `Dockerfile` multi-stage:

1. instala dependencias automáticamente (`npm ci`),
2. genera build (`npm run build`),
3. arranca servidor Node que sirve `dist` y expone `/api/*`.

### Build de imagen

```bash
docker build -t football-predictions:latest .
```

### Run de contenedor

```bash
docker run --rm -p 3000:3000 \
  -e SPORTMONKS_API_TOKEN=tu_token \
  -e PORT=3000 \
  football-predictions:latest
```

Health endpoint:

```bash
curl http://localhost:3000/health
```

---

## 5) Despliegue en EasyPanel (sin pasos manuales ambiguos)

Configurar servicio tipo **App from Git** con Dockerfile.

### Parámetros exactos

- **Build method:** `Dockerfile`
- **Dockerfile path:** `./Dockerfile`
- **Build command:** _No aplica_ (lo ejecuta Dockerfile)
- **Start command:** _No aplica_ (usa `CMD ["npm", "run", "start"]` del Dockerfile)
- **Container port:** `3000`
- **Healthcheck (recomendado):** `GET /health`
- **Volume:** No requerido
- **Reverse proxy:** Sí (HTTP service normal de EasyPanel)

### Environment variables en EasyPanel

- `SPORTMONKS_API_TOKEN=<TU_TOKEN_REAL>`
- `PORT=3000`

Con esta configuración, EasyPanel:

- clona repo,
- construye imagen,
- instala dependencias automáticamente,
- ejecuta build automáticamente,
- arranca automáticamente el contenedor listo para producción.

---

## 6) Campos oficiales vs campos derivados

### Oficiales (Sportmonks)

- `metadata.predictable`
- `predictions.probability` (endpoint de probabilities)
- `predictions.odd`
- `predictions.fair_odd`
- `predictions.is_value`
- `predictions.stake`
- `predictions.bookmaker`

### Derivados internos de UI

- `isValuePick` (alias interno de `predictions.is_value`)
- `suggestedStake` (alias interno de `predictions.stake`)
- `edgePercent` (cálculo de presentación)
- Badges/copies de UX (ej. “VALUE DETECTED”)

Regla: los derivados **no** se presentan como si fueran campos oficiales de la API.

---

## 7) Lógica funcional preservada

Se mantiene la lógica del producto:

- usar predicciones/probabilities/value bets de Sportmonks,
- priorizar visualmente mejores oportunidades,
- premium arriba,
- mercado completo abajo,
- sin recalcular modelo Sportmonks,
- sin ocultar fixtures del mercado general.

---

## 8) Limitaciones reales (no bloqueantes de despliegue)

- Si el plan no incluye Odds & Predictions, algunos endpoints pueden devolver `402/403`.
- Si se alcanza rate limit, Sportmonks puede responder `429`.
- No todos los fixtures tienen predicciones/value bets.

Estas condiciones se reportan como estado funcional de datos, no como fallo de despliegue.
