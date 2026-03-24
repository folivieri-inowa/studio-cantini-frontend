# Category Table Column Order Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ordinare le colonne della tabella "Riepilogo per categorie" dal più recente (sinistra) al meno recente (destra), indipendentemente da quale sia il mainYear, evidenziando il mainYear con bold + colore primario.

**Architecture:** Modifica del solo `useMemo` delle colonne in `master-category-table.js`. Si costruisce `allYearsSorted` unendo `mainYear` e `compareYears` e ordinandoli desc. Le colonne Entrate e Uscite vengono generate iterando su `allYearsSorted`. L'header del mainYear usa `fontWeight: 'bold'` e `color: 'primary.main'`.

**Tech Stack:** React, TanStack React Table v8, MUI v6

---

### Task 1: Aggiornare il `useMemo` delle colonne in `master-category-table.js`

**Files:**
- Modify: `studio-cantini/src/sections/overview/master/master-category-table.js:171-263`

**Step 1: Sostituire `sortedCompareYears` con `allYearsSorted`**

Nel `useMemo` delle colonne (riga ~172), sostituire:

```js
const sortedCompareYears = [...compareYears].sort((a, b) => a - b);
```

con:

```js
const allYearsSorted = [...new Set([mainYear, ...compareYears])].sort((a, b) => b - a);
```

**Step 2: Aggiornare il blocco Entrate**

Sostituire il blocco che genera le colonne Entrate (attualmente: prima mainYear fisso, poi loop su sortedCompareYears) con un unico loop su `allYearsSorted`:

```js
if (showIncome) {
  allYearsSorted.forEach(year => {
    const isMain = year === mainYear;
    cols.push(
      columnHelper.accessor(row => row.income[year] ?? 0, {
        id: `income_${year}`,
        header: () => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: isMain ? 'bold' : 'regular',
              color: isMain ? 'primary.main' : 'text.primary',
              textAlign: 'right',
            }}
          >
            Entrate {year}
          </Typography>
        ),
        cell: info => {
          if (isMain) {
            return (
              <Typography variant="body1" sx={{ textAlign: 'right' }}>
                {formatCurrency(info.getValue())}
              </Typography>
            );
          }
          return (
            <DeltaCell
              value={info.getValue()}
              referenceValue={info.row.original.income[mainYear] ?? 0}
              referenceYear={mainYear}
              isExpense={false}
              month={selectedMonth}
            />
          );
        },
      })
    );
  });
}
```

**Step 3: Aggiornare il blocco Uscite**

Sostituire il blocco che genera le colonne Uscite con un unico loop su `allYearsSorted`:

```js
if (showExpense) {
  allYearsSorted.forEach(year => {
    const isMain = year === mainYear;
    cols.push(
      columnHelper.accessor(row => row.expense[year] ?? 0, {
        id: `expense_${year}`,
        header: () => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: isMain ? 'bold' : 'regular',
              color: isMain ? 'primary.main' : 'text.primary',
              textAlign: 'right',
            }}
          >
            Uscite {year}
          </Typography>
        ),
        cell: info => {
          if (isMain) {
            return (
              <Typography variant="body1" sx={{ textAlign: 'right' }}>
                {formatCurrency(info.getValue())}
              </Typography>
            );
          }
          return (
            <DeltaCell
              value={info.getValue()}
              referenceValue={info.row.original.expense[mainYear] ?? 0}
              referenceYear={mainYear}
              isExpense
              month={selectedMonth}
            />
          );
        },
      })
    );
  });
}
```

**Step 4: Aggiornare le dipendenze del `useMemo`**

Nessuna modifica alle dipendenze necessaria — `compareYears`, `mainYear`, `selectedMonth`, `showIncome`, `showExpense`, `router` rimangono invariati.

**Step 5: Verificare visivamente**

- Avviare il dev server: `yarn dev`
- Aprire la dashboard master
- Selezionare più anni dalla select
- Verificare che le colonne siano sempre ordinate dal più recente a sx al meno recente a dx
- Verificare che il mainYear abbia header bold + colore primario
- Verificare che i totali nel footer siano corretti

**Step 6: Commit**

```bash
git add studio-cantini/src/sections/overview/master/master-category-table.js
git commit -m "feat: ordina colonne per anno desc e evidenzia mainYear nella tabella categorie"
```
