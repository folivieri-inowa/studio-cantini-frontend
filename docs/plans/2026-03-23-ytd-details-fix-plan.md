# YTD Details Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Correggere le colonne della tabella categoria nella pagina `dashboard/master/category/[id]` in modo che le righe espanse (dettagli) mostrino i valori YTD fino al mese selezionato, anziché il totale dell'intero anno.

**Architecture:** Il backend calcola YTD per dettaglio accumulando i totali mensili in `detailMonthlyMap` durante il loop delle transazioni, poi aggiunge i campi `ytdExpense/ytdIncome/prevYtdExpense/prevYtdIncome` ad ogni `value` nell'array `subject.values`. Il frontend sostituisce `val.totalExpense` con `val.ytdExpense` (con fallback) nelle righe espanse della tabella.

**Tech Stack:** Node.js/Fastify (backend), React/Next.js con TanStack Table (frontend)

---

### Task 1: Backend — Accumulare totali mensili per dettaglio

**Files:**
- Modify: `backend/routes/report.js` — endpoint `GET /category/details` (riga ~450, nel forEach delle transazioni)

**Step 1: Aprire il file e localizzare il punto di inserimento**

In `backend/routes/report.js`, trovare il blocco `transactions.forEach(tx => {` (circa riga 450). Subito **prima** di questo forEach, aggiungere la struttura `detailMonthlyMap`:

```js
// Aggiungi PRIMA di: transactions.forEach(tx => {
const detailMonthlyMap = {}; // { detailId: { [month]: { income, expense, prevIncome, prevExpense } } }
```

**Step 2: Popolare `detailMonthlyMap` dentro il forEach delle transazioni**

Dentro il blocco `if (tx.detailid)` (circa riga 527), dopo l'aggiornamento dei totali del soggetto (`report.subcategories[subjectId].totalExpense += absAmount`), aggiungere:

```js
// Dopo gli update dei totali soggetto, dentro if (tx.detailid):
const detailId = tx.detailid;
if (!detailMonthlyMap[detailId]) {
  detailMonthlyMap[detailId] = {};
  for (let dm = 1; dm <= 12; dm++) {
    detailMonthlyMap[detailId][dm] = { income: 0, expense: 0, prevIncome: 0, prevExpense: 0 };
  }
}
if (amount > 0) {
  const amountRounded = parseFloat(amount.toFixed(2));
  if (isPrevYear) {
    detailMonthlyMap[detailId][month].prevIncome += amountRounded;
  } else {
    detailMonthlyMap[detailId][month].income += amountRounded;
  }
} else {
  const absAmount = parseFloat(Math.abs(amount).toFixed(2));
  if (isPrevYear) {
    detailMonthlyMap[detailId][month].prevExpense += absAmount;
  } else {
    detailMonthlyMap[detailId][month].expense += absAmount;
  }
}
```

> **Attenzione:** La variabile `detailId` è già dichiarata più avanti nello stesso blocco `if (tx.detailid)` (circa riga 529: `const detailId = tx.detailid;`). Usare lo stesso nome senza ridichiarare — il blocco di codice sopra va inserito **dopo** quella dichiarazione.

**Step 3: Aggiungere i campi YTD nel `values.map()`**

Trovare il blocco `subject.values = filteredValues.map(value => {` (circa riga 592). Alla fine del `return { ...value, ... }`, aggiungere i quattro campi YTD:

```js
// Calcola YTD per questo dettaglio
let detYtdIncome = 0;
let detYtdExpense = 0;
let detPrevYtdIncome = 0;
let detPrevYtdExpense = 0;

const detMap = detailMonthlyMap[value.id];
if (detMap) {
  for (let m = 1; m <= selectedMonth; m++) {
    const dm = detMap[m] ?? { income: 0, expense: 0, prevIncome: 0, prevExpense: 0 };
    detYtdIncome     += parseFloat(dm.income ?? 0);
    detYtdExpense    += parseFloat(dm.expense ?? 0);
    detPrevYtdIncome += parseFloat(dm.prevIncome ?? 0);
    detPrevYtdExpense+= parseFloat(dm.prevExpense ?? 0);
  }
}

return {
  ...value,
  averageCost: avgCost.toFixed(2),
  totalExpense: totalExpense.toFixed(2),
  totalIncome: totalIncome.toFixed(2),
  ytdExpense:     parseFloat(detYtdExpense.toFixed(2)),
  ytdIncome:      parseFloat(detYtdIncome.toFixed(2)),
  prevYtdExpense: parseFloat(detPrevYtdExpense.toFixed(2)),
  prevYtdIncome:  parseFloat(detPrevYtdIncome.toFixed(2)),
};
```

**Step 4: Testare manualmente il backend**

Con il server in esecuzione (`npm run dev` nella cartella `backend`), chiamare:

```
GET /v1/report/category/details?id=<category_id>&owner=all-accounts&year=2026&db=<db>&month=3
```

Verificare nella risposta che ogni oggetto dentro `averageMonthlyCosts[n].values[m]` contenga i campi:
- `ytdExpense` — somma uscite Gen–Mar per quel dettaglio
- `ytdIncome`
- `prevYtdExpense`
- `prevYtdIncome`

**Step 5: Commit backend**

```bash
cd backend
git add routes/report.js
git commit -m "feat: add YTD fields per detail in category report endpoint"
```

---

### Task 2: Frontend — Usare i campi YTD nelle righe espanse

**Files:**
- Modify: `studio-cantini/src/sections/overview/category/category-subject-table.js` — righe espanse (~395–420)

**Step 1: Sostituire i valori nelle celle delle righe espanse**

Trovare il blocco `{row.original.values.map((val, idx) => (` (circa riga 389). Dentro questo map, ci sono quattro punti da modificare:

**Entrate anno corrente** (circa riga 396–398):
```js
// PRIMA:
<Typography variant="body2">{formatCurrency(parseFloat(val.totalIncome || 0))}</Typography>

// DOPO:
<Typography variant="body2">{formatCurrency(parseFloat(val.ytdIncome ?? val.totalIncome ?? 0))}</Typography>
```

**DeltaCell entrate anno precedente** (circa righe 402–408):
```js
// PRIMA:
<DeltaCell
  value={parseFloat(val.prevTotalIncome || 0)}
  referenceValue={parseFloat(val.totalIncome || 0)}
  ...
/>

// DOPO:
<DeltaCell
  value={parseFloat(val.prevYtdIncome ?? val.prevTotalIncome ?? 0)}
  referenceValue={parseFloat(val.ytdIncome ?? val.totalIncome ?? 0)}
  ...
/>
```

**Uscite anno corrente** (circa riga 411–413):
```js
// PRIMA:
<Typography variant="body2">{formatCurrency(parseFloat(val.totalExpense || 0))}</Typography>

// DOPO:
<Typography variant="body2">{formatCurrency(parseFloat(val.ytdExpense ?? val.totalExpense ?? 0))}</Typography>
```

**DeltaCell uscite anno precedente** (circa righe 416–422):
```js
// PRIMA:
<DeltaCell
  value={parseFloat(val.prevTotalExpense || 0)}
  referenceValue={parseFloat(val.totalExpense || 0)}
  ...
/>

// DOPO:
<DeltaCell
  value={parseFloat(val.prevYtdExpense ?? val.prevTotalExpense ?? 0)}
  referenceValue={parseFloat(val.ytdExpense ?? val.totalExpense ?? 0)}
  ...
/>
```

**Step 2: Verificare visivamente nel browser**

1. Aprire la dashboard e impostare il mese YTD a **Marzo** (o qualsiasi mese diverso da Dicembre)
2. Navigare a `dashboard/master/category/[id]` per una categoria con dati
3. Espandere un soggetto con più dettagli
4. Verificare che i valori dei dettagli siano **minori o uguali** a quelli del soggetto padre (logicamente corretto: YTD parziale < anno intero)
5. Verificare che il tooltip delle `DeltaCell` mostri il periodo corretto (es. "Gen–Mar")

**Step 3: Commit frontend**

```bash
cd studio-cantini
git add src/sections/overview/category/category-subject-table.js
git commit -m "fix: use YTD fields for detail rows in category subject table"
```

---

## Verifica finale

Dopo entrambi i task:

1. Mese YTD = Marzo → i dettagli mostrano Gen–Mar, non l'anno intero ✅
2. Mese YTD = Dicembre → i dettagli mostrano tutto l'anno (YTD = totale anno) ✅
3. Confronto anno precedente nelle righe espanse usa lo stesso periodo YTD ✅
4. Il livello soggetto (riga principale) non è cambiato e continua a funzionare correttamente ✅
5. Nessuna regressione nelle colonne del footer ✅
