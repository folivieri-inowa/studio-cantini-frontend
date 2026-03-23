# YTD Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Le card "Entrate" e "Uscite" della dashboard master devono calcolare i totali YTD (Gen → mese selezionato) allineandosi al selettore di mese del "Riepilogo per categorie".

**Architecture:** Si solleva `selectedMonth` da stato locale di `MasterCategoryTable` a stato controllato in `MasterAnalyticsView`. Le funzioni `getGlobalIncome` e `getGlobalExpense` vengono aggiornate per filtrare i mesi in base a `selectedMonth`. `MasterCategoryTable` diventa un componente controlled per il mese.

**Tech Stack:** React (useState, useEffect, useMemo), Next.js 15, Material-UI v6, JavaScript/JSX

---

### Task 1: Lift up `selectedMonth` in `MasterAnalyticsView`

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiungere lo stato `selectedMonth` nel parent**

Trovare il blocco di stati all'inizio di `MasterAnalyticsView` (dopo `const [snackbar, setSnackbar] = useState(...)`) e aggiungere:

```js
const currentRealYear = new Date().getFullYear();
const currentRealMonth = new Date().getMonth() + 1;

const [selectedMonth, setSelectedMonth] = useState(() => {
  const mainYear = settings.year === 'all-years'
    ? currentRealYear
    : Number(settings.year);
  return mainYear >= currentRealYear ? currentRealMonth : 12;
});
```

**Step 2: Aggiungere il `useEffect` di reset al cambio anno**

Dopo il `useEffect` per `fetchData`, aggiungere:

```js
useEffect(() => {
  const mainYear = settings.year === 'all-years'
    ? currentRealYear
    : Number(settings.year);
  setSelectedMonth(mainYear >= currentRealYear ? currentRealMonth : 12);
}, [settings.year, currentRealYear, currentRealMonth]);
```

**Step 3: Passare `selectedMonth` e `onMonthChange` a `MasterCategoryTable`**

Trovare nel JSX il render di `MasterCategoryTable` (circa riga 955):

```jsx
<MasterCategoryTable
  data={data}
  mainYear={settings.year === 'all-years' ? new Date().getFullYear() : Number(settings.year)}
  owner={settings.owner}
/>
```

Sostituire con:

```jsx
<MasterCategoryTable
  data={data}
  mainYear={settings.year === 'all-years' ? new Date().getFullYear() : Number(settings.year)}
  owner={settings.owner}
  selectedMonth={selectedMonth}
  onMonthChange={setSelectedMonth}
/>
```

**Step 4: Verificare visivamente che la tabella funzioni ancora**

Aprire la dashboard, cambiare mese nella timeline — la tabella deve rispondere come prima.

**Step 5: Commit**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: lift selectedMonth state to MasterAnalyticsView"
```

---

### Task 2: Convertire `MasterCategoryTable` a controlled

**Files:**
- Modify: `src/sections/overview/master/master-category-table.js`

**Step 1: Aggiungere le nuove prop alla firma del componente**

Trovare:
```js
export default function MasterCategoryTable({ data, mainYear, owner }) {
```

Sostituire con:
```js
export default function MasterCategoryTable({ data, mainYear, owner, selectedMonth: selectedMonthProp, onMonthChange }) {
```

**Step 2: Rimuovere lo stato locale `selectedMonth`**

Trovare e rimuovere:
```js
const defaultMonth = mainYear >= currentYear ? currentMonth : 12;
const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
```

Sostituire con:
```js
const selectedMonth = selectedMonthProp ?? (mainYear >= currentYear ? currentMonth : 12);
```

**Step 3: Rimuovere il `useEffect` di reset del mese**

Trovare e rimuovere:
```js
// Resetta selectedMonth quando cambia l'anno principale
useEffect(() => {
  setSelectedMonth(mainYear >= currentYear ? currentMonth : 12);
}, [mainYear, currentYear, currentMonth]);
```

**Step 4: Aggiornare il handler del cambio mese nei Tabs**

Trovare:
```jsx
onChange={(_, newIndex) => setSelectedMonth(newIndex + 1)}
```

Sostituire con:
```jsx
onChange={(_, newIndex) => onMonthChange?.(newIndex + 1)}
```

**Step 5: Aggiornare i PropTypes**

Trovare:
```js
MasterCategoryTable.propTypes = {
  data: PropTypes.array.isRequired,
  mainYear: PropTypes.number.isRequired,
  owner: PropTypes.object,
};
```

Sostituire con:
```js
MasterCategoryTable.propTypes = {
  data: PropTypes.array.isRequired,
  mainYear: PropTypes.number.isRequired,
  owner: PropTypes.object,
  selectedMonth: PropTypes.number,
  onMonthChange: PropTypes.func,
};
```

**Step 6: Verificare che la tabella risponda al mese correttamente**

Aprire la dashboard, cambiare mese — la tabella deve aggiornarsi. Cambiare anno — il mese deve resettarsi.

**Step 7: Commit**

```bash
git add src/sections/overview/master/master-category-table.js
git commit -m "feat: convert MasterCategoryTable to controlled selectedMonth"
```

---

### Task 3: Applicare YTD a `getGlobalIncome`

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiornare la firma e la logica di `getGlobalIncome`**

Trovare la funzione `getGlobalIncome` (circa riga 434). La funzione non riceve parametri, ma ora deve usare `selectedMonth` dal closure.

Nel blocco `if (!isAllYears)`, trovare:

```js
const sortedMonths = Object.entries(selectedReport.months).sort(
  ([a], [b]) => Number(a) - Number(b)
);

const filteredMonths = sortedMonths;
```

Sostituire con:

```js
const sortedMonths = Object.entries(selectedReport.months).sort(
  ([a], [b]) => Number(a) - Number(b)
);

const filteredMonths = sortedMonths.filter(([month]) => Number(month) <= selectedMonth);
```

**Step 2: Aggiornare il calcolo `percentChange` per usare lo stesso filtro YTD sull'anno precedente**

Trovare nel blocco `if (!isAllYears)`:

```js
let percentChange = 0;
const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
if (prevYearReport) {
  const prevYearIncome = parseFloat(
    Object.values(prevYearReport.months).reduce((sum, m) => sum + (m?.income ?? 0), 0).toFixed(2)
  );
  if (prevYearIncome !== 0) {
    percentChange = parseFloat(((totalIncome - prevYearIncome) / prevYearIncome * 100).toFixed(2));
  }
}
```

Sostituire con:

```js
let percentChange = 0;
const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
if (prevYearReport) {
  const prevYearIncome = parseFloat(
    Object.entries(prevYearReport.months)
      .filter(([month]) => Number(month) <= selectedMonth)
      .reduce((sum, [, m]) => sum + (m?.income ?? 0), 0)
      .toFixed(2)
  );
  if (prevYearIncome !== 0) {
    percentChange = parseFloat(((totalIncome - prevYearIncome) / prevYearIncome * 100).toFixed(2));
  }
}
```

**Step 3: Aggiornare il `useMemo` di `globalIncomeData` per dipendere da `selectedMonth`**

Trovare:
```js
const globalIncomeData = useMemo(() => {
  if (!data || !settings.owner) return { incomeData: [], totalIncome: 0, percentChange: 0 };
  return getGlobalIncome();
}, [data, settings.owner, settings.year]);
```

Sostituire con:
```js
const globalIncomeData = useMemo(() => {
  if (!data || !settings.owner) return { incomeData: [], totalIncome: 0, percentChange: 0 };
  return getGlobalIncome();
}, [data, settings.owner, settings.year, selectedMonth]);
```

**Step 4: Verificare visivamente**

Aprire la dashboard con anno 2026 selezionato. La card "Entrate" deve mostrare solo il totale Gen-Mar (o il mese corrente). Cambiare mese nella tabella — la card deve aggiornarsi.

**Step 5: Commit**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: apply YTD filter to getGlobalIncome"
```

---

### Task 4: Applicare YTD a `getGlobalExpense`

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiornare il filtro mesi in `getGlobalExpense`**

Trovare la funzione `getGlobalExpense` (circa riga 518). Nel blocco `if (!isAllYears)`, trovare:

```js
const sortedMonths = Object.entries(selectedReport.months).sort(
  ([a], [b]) => Number(a) - Number(b)
);

const filteredMonths = sortedMonths;
```

Sostituire con:

```js
const sortedMonths = Object.entries(selectedReport.months).sort(
  ([a], [b]) => Number(a) - Number(b)
);

const filteredMonths = sortedMonths.filter(([month]) => Number(month) <= selectedMonth);
```

**Step 2: Aggiornare il `percentChange` dell'anno precedente con filtro YTD**

Trovare nel blocco `if (!isAllYears)`:

```js
let percentChange = 0;
const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
if (prevYearReport) {
  const prevYearExpense = parseFloat(
    Object.values(prevYearReport.months).reduce((sum, m) => sum + (m?.expense ?? 0), 0).toFixed(2)
  );
  if (prevYearExpense !== 0) {
    percentChange = parseFloat(((totalExpense - prevYearExpense) / prevYearExpense * 100).toFixed(2));
  }
}
```

Sostituire con:

```js
let percentChange = 0;
const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
if (prevYearReport) {
  const prevYearExpense = parseFloat(
    Object.entries(prevYearReport.months)
      .filter(([month]) => Number(month) <= selectedMonth)
      .reduce((sum, [, m]) => sum + (m?.expense ?? 0), 0)
      .toFixed(2)
  );
  if (prevYearExpense !== 0) {
    percentChange = parseFloat(((totalExpense - prevYearExpense) / prevYearExpense * 100).toFixed(2));
  }
}
```

**Step 3: Aggiornare il `useMemo` di `globalExpenseData` per dipendere da `selectedMonth`**

Trovare:
```js
const globalExpenseData = useMemo(() => {
  if (!data || !settings.owner) return { expenseData: [], totalExpense: 0, percentChange: 0 };
  return getGlobalExpense();
}, [data, settings.owner, settings.year]);
```

Sostituire con:
```js
const globalExpenseData = useMemo(() => {
  if (!data || !settings.owner) return { expenseData: [], totalExpense: 0, percentChange: 0 };
  return getGlobalExpense();
}, [data, settings.owner, settings.year, selectedMonth]);
```

**Step 4: Verificare visivamente**

Aprire la dashboard. La card "Uscite" deve mostrare solo il totale YTD. Cambiare mese — la card deve aggiornarsi. Cambiare anno — il mese deve resettarsi e le card devono ricalcolare.

**Step 5: Commit**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: apply YTD filter to getGlobalExpense"
```

---

### Task 5: Aggiornare il sottotitolo/description delle card

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiungere la label del mese selezionato**

All'interno di `MasterAnalyticsView`, dopo la dichiarazione di `selectedMonth`, aggiungere:

```js
const MONTHS_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const selectedMonthLabel = MONTHS_LABELS[selectedMonth - 1] ?? '';
```

**Step 2: Aggiornare il `title` delle card Entrate e Uscite nel JSX**

Trovare nel JSX (circa riga 936):

```jsx
<BankingWidgetSummary
  title="Entrate"
  ...
/>

<BankingWidgetSummary
  title="Uscite"
  ...
/>
```

Aggiungere la prop `description` con il periodo YTD a entrambe le card (se il componente la supporta), oppure aggiornare il `title`:

```jsx
<BankingWidgetSummary
  title="Entrate"
  description={settings.year !== 'all-years' ? `Gen – ${selectedMonthLabel} ${settings.year}` : undefined}
  ...
/>

<BankingWidgetSummary
  title="Uscite"
  color="warning"
  description={settings.year !== 'all-years' ? `Gen – ${selectedMonthLabel} ${settings.year}` : undefined}
  ...
/>
```

**Step 3: Verificare che `BankingWidgetSummary` accetti la prop `description`**

Leggere `src/sections/overview/banking/banking-widget-summary.js` e verificare le prop accettate. Se non esiste `description`, usare `chart.series` già presenti o scegliere il campo più adatto disponibile.

**Step 4: Verificare visivamente**

Le card devono mostrare il periodo (es. "Gen – Mar 2026") come sottotitolo.

**Step 5: Commit**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: show YTD period label on income/expense cards"
```

---

## Verifica finale

1. Selezionare anno 2026, mese Marzo → card entrate e uscite mostrano totale Gen-Mar
2. Cambiare a mese Giugno → card si aggiornano a Gen-Giu
3. Cambiare anno a 2025 → mese resetta a Dicembre, card mostrano totale annuale 2025
4. Modalità `all-years` → card invariate rispetto a prima
5. Selezionare "Tutti i conti" → tutto funziona come sopra
