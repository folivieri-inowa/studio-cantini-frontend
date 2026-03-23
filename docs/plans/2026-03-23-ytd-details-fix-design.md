# Design: Fix YTD per i dettagli nella tabella categoria

**Data**: 2026-03-23
**Pagina**: `dashboard/master/category/[id]`
**Componente**: `CategorySubjectTable` (righe espanse)

## Problema

Le colonne della griglia nella pagina categoria mostrano i **totali dell'intero anno** per i dettagli (righe espanse), ignorando il mese YTD impostato nella dashboard.

- Il livello **soggetto** (riga principale) usa correttamente `ytdExpense` / `ytdIncome` — calcolati nel backend sommando `monthlyDetails` da Gen a `selectedMonth`.
- Il livello **dettaglio** (riga espansa) usa `val.totalExpense` / `val.totalIncome` — totale anno intero, senza filtro YTD.

## Causa radice

Il backend (`backend/routes/report.js`, endpoint `GET /category/details`) non calcola campi YTD per i singoli dettagli dentro `subject.values[]`. Ogni `value` contiene solo `totalExpense` e `totalIncome` (somma dell'intero anno corrente), perché il processing dei dettagli avviene filtrando le transazioni dell'anno ma sommandole tutte, senza tenere conto di `selectedMonth`.

## Soluzione

### Backend — Aggiungere `detailMonthlyMap`

Nell'endpoint `/category/details`, durante il loop delle transazioni che popola `report.subcategories`, accumulare anche i totali mensili per ogni dettaglio in una struttura `detailMonthlyMap`:

```
detailMonthlyMap[detailId][month] = { income, expense, prevIncome, prevExpense }
```

Poi, nel `subject.values.map()`, calcolare i campi YTD per ogni dettaglio:

```
ytdIncome      = Σ detailMonthlyMap[id][m].income      per m = 1..selectedMonth
ytdExpense     = Σ detailMonthlyMap[id][m].expense     per m = 1..selectedMonth
prevYtdIncome  = Σ detailMonthlyMap[id][m].prevIncome  per m = 1..selectedMonth
prevYtdExpense = Σ detailMonthlyMap[id][m].prevExpense per m = 1..selectedMonth
```

I campi esistenti (`totalExpense`, `totalIncome`) restano invariati → **non-breaking**.

### Frontend — Usare i nuovi campi YTD nelle righe espanse

In `category-subject-table.js`, nelle righe espanse:

| Prima | Dopo |
|-------|------|
| `val.totalIncome` | `val.ytdIncome ?? val.totalIncome` |
| `val.totalExpense` | `val.ytdExpense ?? val.totalExpense` |
| `val.prevTotalIncome` | `val.prevYtdIncome ?? val.prevTotalIncome` |
| `val.prevTotalExpense` | `val.prevYtdExpense ?? val.prevTotalExpense` |

Il fallback `??` garantisce retrocompatibilità.

## File coinvolti

| File | Tipo modifica |
|------|--------------|
| `backend/routes/report.js` | Aggiunta `detailMonthlyMap` nel loop tx + calcolo YTD in `values.map()` |
| `studio-cantini/src/sections/overview/category/category-subject-table.js` | 4 sostituzioni di campo nelle righe espanse |

## Test

- Impostare un mese YTD diverso da Dicembre nella dashboard (es. Marzo)
- Navigare alla pagina categoria
- Espandere un soggetto con più dettagli
- Verificare che i valori dei dettagli coincidano con la somma Gen–Marzo, non l'anno intero
- Verificare che il confronto anno precedente usi anch'esso il periodo YTD corretto
