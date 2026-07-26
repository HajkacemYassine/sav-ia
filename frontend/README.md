# SAV-IA — Frontend

Interface React + TypeScript pour la plateforme intelligente d'assistance SAV.
Aucune authentification : l'identité (client / technicien / administrateur)
est choisie à l'écran d'accueil et transmise via les paramètres d'ID aux APIs.

## Stack

- **React 18 + TypeScript** — via Vite
- **Tailwind CSS** — design system personnalisé (graphite / signal / hazard / repair)
- **TanStack Query** — appels API, cache, polling
- **React Router v6** — navigation
- **Recharts** — graphiques du tableau de bord admin
- **lucide-react** — icônes

## Design

Direction visuelle inspirée du monde du diagnostic technique (plaques
signalétiques d'appareils, cadrans d'instruments de mesure) plutôt qu'un
style SaaS générique. L'élément signature est la **jauge de diagnostic**
(`DiagnosticGauge`), un cadran façon multimètre qui affiche le score de
confiance de l'IA.

Typographies : Space Grotesk (titres), Inter (texte), IBM Plex Mono
(numéros de ticket, références pièces, scores).

## Installation

```bash
npm install
```

## Lancer en développement

Assure-toi que ton backend FastAPI tourne sur `http://localhost:8000`
(Docker : PostgreSQL + Qdrant + Redis démarrés, puis `uvicorn app.main:app --reload`).

```bash
npm run dev
```

L'application est disponible sur **http://localhost:5173**.
Les appels `/api/*` sont automatiquement redirigés vers `localhost:8000`
par le proxy Vite (voir `vite.config.ts`) — aucune configuration `.env`
n'est nécessaire en développement.

## Build de production

```bash
npm run build
npm run preview
```

En production, sers le dossier `dist/` derrière le même reverse-proxy
(Nginx) que ton API FastAPI, avec `/api/*` routé vers le backend.

## Structure

```
src/
├── api/              # Appels HTTP + hooks TanStack Query par domaine
├── components/       # Composants réutilisables
│   ├── layout/        # AppShell (dashboard), FocusShell (parcours client)
│   ├── ui/            # Primitives (Button, Card, Badge, Field…)
│   ├── DiagnosticGauge.tsx   # Élément signature
│   └── DiagnosticPanel.tsx   # Affichage complet d'un diagnostic IA
├── context/          # Sélection d'identité (sans authentification)
├── lib/              # Formatage, métadonnées statut/priorité
├── pages/
│   ├── client/        # Déclarer une panne, mes tickets, détail
│   ├── tech/           # Dashboard technicien, traitement de ticket + chat IA
│   └── admin/          # Statistiques, base documentaire RAG
└── types/            # Types alignés sur les schémas Pydantic du backend
```

## Pages principales

| Route | Rôle | Description |
|---|---|---|
| `/` | — | Sélection d'identité (client / technicien / admin) |
| `/client` | Client | Liste des dossiers SAV |
| `/client/new` | Client | Déclarer une panne (formulaire 3 étapes) |
| `/client/tickets/:id` | Client | Détail + diagnostic IA en temps réel |
| `/tech` | Technicien | Tickets assignés, triés par priorité |
| `/tech/tickets/:id` | Technicien | Diagnostic, actions, chat IA assisté |
| `/admin` | Admin | Statistiques (graphiques) |
| `/admin/documents` | Admin | Upload et indexation de documents RAG |
