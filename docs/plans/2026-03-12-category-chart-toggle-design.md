# Design: Toggle Chart in Category Details View

**Data:** 2026-03-12
**Stato:** Approvato

---

## Problema

In `category-details-view.js` sono presenti due grafici sovrapposti che mostrano gli stessi dati mensili (entrate/uscite anno corrente vs anno precedente):

- `ChartColumnMultiple` — grafico a barre, visione discreta mese per mese
- `EcommerceMultiYearSales` — grafico ad area, visione continua dell'andamento

Mostrare entrambi contemporaneamente è ridondante e occupa spazio inutile. L'utente non ha modo di scegliere quale preferisce.

---

## Soluzione

Introdurre un toggle nell'header della card che permette di switchare tra le due visualizzazioni. La preferenza viene salvata in `localStorage` (globale, non per categoria) e persiste tra sessioni.

---

## Approccio scelto: Componente wrapper `CategoryChartToggle`

### Motivazione

Separare la logica del toggle dal componente view principale mantiene `category-details-view.js` focalizzato sul fetch dati e sulla struttura della pagina. Il nuovo componente è isolato e potenzialmente riusabile.

### File coinvolti

| File | Operazione |
|------|-----------|
| `src/sections/overview/category/category-chart-toggle.js` | **Nuovo** — componente wrapper con toggle |
| `src/sections/overview/category/view/category-details-view.js` | **Modificato** — rimuove i due Grid chart, aggiunge `<CategoryChartToggle>` |

### Nessuna modifica a

- `ChartColumnMultiple` — usato as-is
- `EcommerceMultiYearSales` — usato as-is
- Backend / API — nessuna variazione
- Dipendenze npm — nessuna aggiunta

---

## Dettaglio implementazione

### `CategoryChartToggle` — props in ingresso

```js
CategoryChartToggle.propTypes = {
  // Dati già elaborati da getChartData() in category-details-view.js
  barSeries: PropTypes.array,       // formato ChartColumnMultiple
  barCategories: PropTypes.array,
  barColors: PropTypes.array,

  // Dati già elaborati da adaptChartDataForMultiYear() in category-details-view.js
  areaChart: PropTypes.object,      // formato EcommerceMultiYearSales { colors, categories, series }
}
```

### Stato interno

```js
const [chartType, setChartType] = useState(() => {
  return localStorage.getItem('category-chart-type') || 'bar';
});

const handleToggle = (type) => {
  setChartType(type);
  localStorage.setItem('category-chart-type', type);
};
```

### UI toggle — `CardHeader` action

Due `IconButton` affiancati nell'header della card contenitore:

- `BarChartIcon` → attiva vista barre
- `ShowChartIcon` (MUI) → attiva vista area
- Icona attiva: `color="primary"`, inattiva: `color="disabled"`

```
┌─────────────────────────────────────────────────────┐
│  Andamento entrate/uscite            [▦] [〜]        │
│                                      bar  area       │
│                                                      │
│  [grafico attivo — barre o area]                     │
└─────────────────────────────────────────────────────┘
```

### Rendering condizionale

```jsx
{chartType === 'bar' ? (
  <ChartColumnMultiple
    title=""
    categories={barCategories}
    series={barSeries}
    colors={barColors}
  />
) : (
  <EcommerceMultiYearSales
    title=""
    subheader=""
    chart={areaChart}
  />
)}
```

### Modifiche a `category-details-view.js`

1. Rimuovere il blocco `<Grid size={12}><Stack direction='column' spacing={3}>...</Stack></Grid>` che contiene i due chart
2. Aggiungere `<CategoryChartToggle>` con le props calcolate da `getChartData` e `adaptChartDataForMultiYear` (funzioni che rimangono nella view)
3. Aggiungere l'import del nuovo componente

---

## Chiave localStorage

```
'category-chart-type'   →   'bar' | 'area'   (default: 'bar')
```

Globale per tutta l'app — la stessa preferenza si applica a tutte le categorie.

---

## Fuori scope

- Animazione di transizione tra i due chart
- Preferenza per-categoria
- Persistenza lato server della preferenza
