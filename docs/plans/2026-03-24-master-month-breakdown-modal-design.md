# Design: Modal drill-down "Andamento mensile uscite" — Dashboard principale

**Data**: 2026-03-24
**Scope**: `master-analytics-view.js` + nuovi/modificati componenti

---

## Obiettivo

Rendere cliccabile il grafico "Andamento mensile uscite" nella dashboard principale (`master-analytics-view`), aprendo una modal di drill-down a tre livelli:

1. **Categorie** — dati già in memoria, zero fetch aggiuntivi
2. **Soggetti / Dettagli** — riusa `MonthBreakdownDialog` con prop `viewOnly`
3. **Movimenti** — riusa `MonthTransactionsQuickView` già esistente

---

## Componenti coinvolti

### 1. `MonthBreakdownDialog` — aggiunta prop `viewOnly`

**File**: `src/sections/overview/category/month-breakdown-dialog.js`

- Aggiunge prop `viewOnly?: bool` (default `false`)
- Quando `viewOnly={true}`:
  - Nasconde colonna checkbox
  - Nasconde chip esclusioni e "Reset tutto"
  - Non richiede `exclusions`, `onToggleExclusion`, `monthlyAvg`
  - Il pulsante "Elenco movimenti" (icona documento) rimane visibile
- Nessuna logica di esclusione attivata
- Retrocompatibile: il comportamento esistente in `category-details-view` non cambia

### 2. Nuovo `MasterMonthBreakdownDialog`

**File**: `src/sections/overview/master/master-month-breakdown-dialog.js`

#### State interno
```js
const [selectedCategory, setSelectedCategory] = useState(null); // { id, name }
const categoryBreakdown = useBoolean(); // controlla MonthBreakdownDialog
```

#### Livello 0 — Lista categorie
- Dati derivati dai props (già in memoria in `master-analytics-view`):
  ```
  owner.report.categoryReport[year][catId].months[paddedMonth].expense
  ```
- Ordinate per importo decrescente
- Ogni riga mostra:
  - **Nome categoria** (cliccabile) → naviga a `paths.dashboard.master.category.details({ id })` con params: `month`, `compareYears`, `showIncome=false`, `showExpense=true`
  - **Totale uscite mese** (allineato a destra)
  - **Icona freccia `›`** → apre livello 1 (MonthBreakdownDialog viewOnly)
- Totale mese in fondo (somma di tutte le categorie)

#### Livello 1 — Soggetti/Dettagli
- Monta `MonthBreakdownDialog` con:
  - `viewOnly={true}`
  - `category={selectedCategory.id}`
  - `month`, `year`, `db`, `owner` dai props
  - Nessun `exclusions`, nessun `monthlyAvg`, nessun `onToggleExclusion`
  - **Nessun confronto con anno precedente** — la dashboard mostra solo l'anno selezionato

#### Props
```js
{
  open: bool,
  onClose: func,
  month: number,          // 1-based
  year: string|number,
  owner: object,          // settings.owner (con report.categoryReport)
  db: string,
  compareYears: array,    // per la navigazione alla pagina categoria
}
```

### 3. `master-analytics-view.js` — modifiche

- Aggiunge state: `const [breakdownMonth, setBreakdownMonth] = useState(null)`
- Aggiunge: `const breakdownDialog = useBoolean()`
- Passa a `MasterMonthlyTrendChart`:
  ```jsx
  onBarClick={(idx) => { setBreakdownMonth(idx + 1); breakdownDialog.onTrue(); }}
  ```
- Monta `MasterMonthBreakdownDialog`:
  ```jsx
  <MasterMonthBreakdownDialog
    open={breakdownDialog.value}
    onClose={breakdownDialog.onFalse}
    month={breakdownMonth}
    year={settings.year}
    owner={settings.owner}
    db={settings.db}
    compareYears={compareYears}
  />
  ```
- Rimuove la prop `readonly` (aggiunta erroneamente dal linter) da `MasterMonthlyTrendChart`

---

## Flusso navigazione

```
MasterAnalyticsView
  └─ MasterMonthlyTrendChart
       └─ onBarClick → apre MasterMonthBreakdownDialog
            ├─ Riga categoria [nome cliccabile] → router.push(category details page)
            └─ Riga categoria [icona ›] → apre MonthBreakdownDialog (viewOnly)
                    └─ Icona documento → MonthTransactionsQuickView
```

---

## Dati — Livello 0 (categorie)

Derivati da `settings.owner.report.categoryReport[year]`:

```js
const paddedMonth = String(month).padStart(2, '0');
const categories = Object.entries(owner.report.categoryReport[year] ?? {})
  .map(([id, cat]) => ({
    id,
    name: cat.name,
    expense: cat.months?.[paddedMonth]?.expense ?? 0,
  }))
  .filter(c => c.expense > 0)
  .sort((a, b) => b.expense - a.expense);
```

---

## Vincoli

- **Zero breaking changes** su `category-details-view` e `MonthBreakdownDialog` esistenti
- `viewOnly` è retrocompatibile (default `false`)
- La navigazione alla pagina categoria replica esattamente i parametri di `master-category-table.js`
