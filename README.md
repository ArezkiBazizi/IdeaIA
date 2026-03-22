# Idea-to-Action

Monorepo : **API Node/Fastify** (`backend/`) + **interface Angular** (`frontend/`).

## Prérequis

- Node.js 20+
- Docker (PostgreSQL local)
- Clé API NVIDIA (`NVIDIA_API_KEY`)

## Backend

```bash
cd backend
cp .env.example .env   # ou copier le .env à la racine du dépôt (lu automatiquement)
npm install
# Depuis la racine du dépôt :
docker compose up -d db
cd backend && npx prisma migrate deploy
npm run dev
```

API par défaut : `http://localhost:3000`.

## Frontend

```bash
cd frontend
npm install
npm start
```

Application : `http://localhost:4200`. L’URL de l’API est dans `frontend/src/environments/environment.ts` (`apiUrl`).

## Docker (API + base)

À la racine : `docker compose up -d --build` (nécessite `NVIDIA_API_KEY` dans l’environnement ou un `.env` chargé par Compose).
