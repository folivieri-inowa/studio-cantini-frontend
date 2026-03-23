# YTD Cards — Design Document

**Data**: 2026-03-23
**Feature**: Calcolo YTD sulle card Entrate/Uscite della dashboard master

## Problema

Le card "Entrate" e "Uscite" in `MasterAnalyticsView` calcolano i totali su tutti i 12 mesi dell'anno selezionato, ignorando il mese di riferimento scelto dall'utente nel "Riepilogo per categorie". Questo rende il confronto con l'anno precedente non significativo: si confronta un parziale (anno corrente) con un totale annuale (anno precedente).

## Soluzione

Allineare le card al mese selezionato nella tabella categorie, applicando lo stesso taglio YTD (Gen → mese selezionato) sia all'anno corrente che all'anno precedente di confronto.

## Architettura

### Stato condiviso — Lift Up di `selectedMonth`

`selectedMonth` attualmente vive come stato locale in `MasterCategoryTable`. Viene sollevato a `MasterAnalyticsView` e passato verso il basso come prop.

**In `MasterAnalyticsView`:**

```js
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const defaultMonth = (
  settings.year === 'all-years' || Number(settings.year) >= currentYear
) ? currentMonth : 12;

const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
```

Reset automatico al cambio di anno (via `useEffect` su `settings.year`):
- Anno corrente o `all-years` → `currentMonth`
- Anno passato → `12`

**Props aggiunte a `MasterCategoryTable`:**

```js
<MasterCategoryTable
  data={data}
  mainYear={...}
  owner={...}
  selectedMonth={selectedMonth}      // nuovo: controlled
  onMonthChange={setSelectedMonth}   // nuovo: callback
/>
```

`MasterCategoryTable` rimuove il proprio `useState(defaultMonth)` e usa le prop ricevute. Il `useEffect` di reset del mese si sposta nel parent.

---

### Calcolo YTD in `getGlobalIncome` e `getGlobalExpense`

Le funzioni accettano `selectedMonth` come parametro e filtrano i mesi.

**Logica per singolo anno (non `all-years`):**

```js
// Somma solo i mesi da 01 a selectedMonth
const filteredMonths = sortedMonths.filter(
  ([month]) => Number(month) <= selectedMonth
);

// Anno precedente: stesso filtro
const prevFilteredMonths = Object.entries(prevYearReport.months)
  .filter(([month]) => Number(month) <= selectedMonth);

const prevYearIncome = prevFilteredMonths.reduce(...);
percentChange = (totalIncome - prevYearIncome) / prevYearIncome * 100;
```

**Modalità `all-years`:** nessun cambiamento — comportamento invariato.

---

### Sottotitolo delle card

Le card ricevono un `description` aggiornato che riflette il periodo YTD:

```
"Gen – Mar 2026" (invece di solo il totale annuo)
```

---

## File modificati

| File | Tipo di modifica |
|------|-----------------|
| `src/sections/overview/master/view/master-analytics-view.js` | Lift up `selectedMonth`, aggiornamento `getGlobalIncome`/`getGlobalExpense` con filtro YTD |
| `src/sections/overview/master/master-category-table.js` | Conversione da uncontrolled a controlled per `selectedMonth` |

## Non cambia

- Modalità `all-years` delle card (invariata)
- Logica della tabella categorie (stessa di prima, solo controlled)
- Grafico mensile e multi-anno
- Saldo corrente
