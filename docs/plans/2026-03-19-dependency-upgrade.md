# Dependency Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggiornare tutte le dipendenze del progetto Next.js studio-cantini alle ultime versioni compatibili.

**Architecture:** Aggiornamento incrementale per gruppi di dipendenze correlate (Next/React → MUI → DevDeps), con verifica build dopo ogni gruppo per isolare eventuali breaking changes.

**Tech Stack:** Next.js 16.2, React 19, MUI v7, TypeScript 5.9, ESLint 10, Yarn

---

## Stato attuale vs target

| Pacchetto | Attuale | Target | Note |
|---|---|---|---|
| `next` | 16.2.0 | 16.2.0 | ✅ già aggiornato |
| `react` | 19.0.0 | 19.2.4 | patch update |
| `react-dom` | 19.0.0 | 19.2.4 | patch update |
| `@types/react` | 19.2.14 | 19.2.14 | ✅ già aggiornato |
| `typescript` | ^5.2.2 | 5.9.3 | minor/patch update |
| `eslint` | ^10.0.0 | 10.0.3 | già compatibile |
| `@mui/material` | ^6.4.4 | 7.3.9 | ⚠️ MAJOR - breaking changes |
| `@mui/icons-material` | ^6.4.4 | 7.3.9 | ⚠️ MAJOR |
| `@mui/lab` | ^6.0.0-beta.26 | 7.0.1-beta.23 | ⚠️ MAJOR |
| `@mui/x-data-grid` | ^6.16.1 | 8.27.5 | ⚠️ MAJOR x2 |
| `@mui/x-date-pickers` | ^6.16.1 | 8.27.2 | ⚠️ MAJOR x2 |
| `@mui/x-charts` | ^8.5.1 | 8.27.5 | patch update |
| `@emotion/react` | ^11.14.0 | 11.14.0 | ✅ già aggiornato |
| `@emotion/styled` | ^11.14.0 | 11.14.1 | patch |
| `framer-motion` | ^10.16.4 | 12.38.0 | ⚠️ MAJOR x2 |
| `date-fns` | ^2.29.3 | 4.1.0 | ⚠️ MAJOR x2 |
| `axios` | ^1.13.5 | 1.13.6 | patch |
| `swr` | ^2.2.4 | 2.4.1 | minor |
| `eslint-plugin-react-hooks` | ^7.0.1 | 7.0.1 | ✅ già aggiornato |
| `eslint-plugin-react` | ^7.33.2 | 7.37.5 | minor |
| `eslint-plugin-perfectionist` | ^5.5.0 | 5.7.0 | minor |
| `prettier` | ^3.0.3 | 3.8.1 | minor |

---

## Strategia di aggiornamento

**ATTENZIONE:** MUI v6→v7 e MUI X v6→v8 sono MAJOR upgrades con breaking changes significativi.
**Raccomandazione:** aggiornare React/patch prima, poi decidere se fare MUI v7 o restare su v6 stabile.

Il piano è diviso in 3 fasi:
1. **Fase 1** — Patch/minor safe: React 19.2.4, axios, swr, emotion, devDeps
2. **Fase 2** — MUI X v6→v8 (data-grid, date-pickers, charts) — breaking changes moderati
3. **Fase 3** — MUI core v6→v7 + framer-motion v12 — breaking changes significativi (opzionale, valutare con team)

---

## Task 1: Backup e branch

**Files:**
- Nessun file modificato

**Step 1: Crea un branch dedicato**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
git checkout -b chore/dependency-upgrade
```

**Step 2: Verifica stato git pulito**

```bash
git status
```
Atteso: working tree clean

---

## Task 2: Aggiorna React e patch-level deps (Fase 1)

**Files:**
- Modify: `package.json`

**Step 1: Aggiorna package.json — React e dipendenze patch/minor**

Modifica le seguenti versioni in `package.json`:

```json
"react": "19.2.4",
"react-dom": "19.2.4",
"@emotion/styled": "^11.14.1",
"axios": "^1.13.6",
"swr": "^2.4.1"
```

**Step 2: Aggiorna devDependencies**

```json
"eslint-plugin-react": "^7.37.5",
"eslint-plugin-perfectionist": "^5.7.0",
"prettier": "^3.8.1",
"typescript": "^5.9.3"
```

**Step 3: Installa**

```bash
yarn install
```
Atteso: nessun errore, lockfile aggiornato

**Step 4: Verifica build**

```bash
yarn build
```
Atteso: build completata senza errori

**Step 5: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: upgrade React 19.2.4, axios, swr, emotion, devDeps"
```

---

## Task 3: Aggiorna MUI X v6→v8 (Fase 2)

**Files:**
- Modify: `package.json`

> ⚠️ MUI X v8 ha breaking changes rispetto a v6. Verificare la migration guide:
> https://mui.com/x/migration/migration-data-grid-v6/
> https://mui.com/x/migration/migration-pickers-v6/

**Step 1: Aggiorna package.json — MUI X**

```json
"@mui/x-data-grid": "^8.27.5",
"@mui/x-date-pickers": "^8.27.2",
"@mui/x-charts": "^8.27.5"
```

**Step 2: Installa**

```bash
yarn install
```

**Step 3: Verifica errori TypeScript**

```bash
npx tsc --noEmit
```
Annotare eventuali errori di tipo.

**Step 4: Verifica build**

```bash
yarn build
```
Se ci sono errori, applicare le fix necessarie seguendo la migration guide MUI X v8.

**Step 5: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: upgrade MUI X to v8 (data-grid, date-pickers, charts)"
```

---

## Task 4: Aggiorna MUI core v6→v7 (Fase 3 — valutare)

**Files:**
- Modify: `package.json`

> ⚠️ BREAKING CHANGES significativi. Migration guide: https://mui.com/material-ui/migration/migrating-from-deprecated-apis/
> Valutare se questo upgrade è necessario ora o può essere posticipato.

**Step 1: Aggiorna package.json — MUI core**

```json
"@mui/material": "^7.3.9",
"@mui/icons-material": "^7.3.9",
"@mui/lab": "^7.0.1-beta.23",
"@mui/styled-engine-sc": "^7.3.9",
"@mui/system": "^7.3.9"
```

**Step 2: Installa**

```bash
yarn install
```

**Step 3: Verifica errori TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Verifica build e lint**

```bash
yarn build
yarn lint
```

**Step 5: Risolvi breaking changes**

Principali breaking changes MUI v7:
- Rimozione di componenti deprecati
- Cambiamenti nelle props dei componenti
- Aggiornamenti al sistema di theming

Consultare: https://mui.com/material-ui/migration/

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: upgrade MUI core to v7"
```

---

## Task 5: Aggiorna framer-motion v10→v12 (Fase 3 — valutare)

**Files:**
- Modify: `package.json`

> ⚠️ Breaking changes tra v10 e v12. Migration guide: https://www.framer.com/motion/guide-upgrade/

**Step 1: Aggiorna package.json**

```json
"framer-motion": "^12.38.0"
```

**Step 2: Installa e verifica**

```bash
yarn install
yarn build
```

**Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: upgrade framer-motion to v12"
```

---

## Task 6: Verifica finale e PR

**Step 1: Verifica build production completa**

```bash
yarn build
```
Atteso: compilazione senza errori

**Step 2: Verifica lint**

```bash
yarn lint
```

**Step 3: Test manuale**

Avviare il dev server e verificare le funzionalità principali:
```bash
yarn dev
```
Verificare: login, dashboard, prima nota, archivio

**Step 4: Push e PR**

```bash
git push origin chore/dependency-upgrade
```
Aprire PR verso main/master per revisione.

---

## Note importanti

- **date-fns v2→v4**: Breaking change molto significativo (API completamente rinnovata). Non incluso in questo piano — richiede refactoring dei formati data in tutto il progetto. Mantenere `^2.29.3` per ora.
- **MUI v6→v7**: Se il progetto è stabile con v6, valutare se l'upgrade è necessario in questo momento.
- **framer-motion v10→v12**: Valutare impatto sulle animazioni esistenti prima di procedere.
