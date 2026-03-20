# Design: Grafici Multi-Anno nella Dashboard Master

**Data:** 2026-03-20
**Stato:** Approvato

## Problema

Quando l'utente seleziona "Tutti gli anni" nella dashboard master, i due grafici di andamento mensile vengono nascosti con un messaggio statico:

> "I grafici di andamento mensile non sono disponibili per periodi che coprono più anni."

I grafici esistenti sono costruiti su un asse Jan→Dic fisso a 12 mesi, pensato per un singolo anno. Mostrarli con dati multi-anno non ha senso.

## Soluzione

Invece di nascondere i grafici, mostrare versioni alternative ottimizzate per il periodo multi-anno, usando gli stessi componenti esistenti con dati costruiti diversamente.

---

## Grafico 1 — Andamento entrate/uscite (`CategoryChartToggle`)

### Comportamento attuale (anno singolo)
- Modalità **area**: `EcommerceMultiYearSales` con serie anno corrente + anno precedente
- Modalità **barre**: `ChartColumnMultiple` con 12 colonne mensili

### Comportamento nuovo (tutti gli anni)
- Solo modalità **area** (il toggle viene nascosto — le barre mensili non hanno senso su più anni)
- Asse X: `['Gen', 'Feb', ..., 'Dic']` — invariato
- Serie: una coppia Entrate/Uscite per ogni anno disponibile, sovrapposte

### Struttura dati `getMultiYearAreaData()`
```js
{
  categories: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
  series: [
    {
      year: '2024',
      data: [
        { name: 'Entrate 2024', data: [/* 12 valori */] },
        { name: 'Uscite 2024',  data: [/* 12 valori */] },
      ]
    },
    {
      year: '2025',
      data: [
        { name: 'Entrate 2025', data: [/* 12 valori */] },
        { name: 'Uscite 2025',  data: [/* 12 valori */] },
      ]
    },
    // ... anni successivi
  ]
}
```

`EcommerceMultiYearSales` appiattisce già le serie in `combinedSeries` → nessuna modifica al componente.

### Palette colori per anno
| Anno | Entrate | Uscite |
|------|---------|--------|
| 2024 | `#4ADDDE` (azzurro) | `#F45757` (rosso) |
| 2025 | `#22C55E` (verde) | `#F97316` (arancio) |
| 2026 | `#A855F7` (viola) | `#EAB308` (giallo) |
| 2027+ | colori aggiuntivi da palette |

---

## Grafico 2 — Andamento mensile uscite (`MasterMonthlyTrendChart`)

### Comportamento attuale (anno singolo)
- Tipo: `bar`
- 1 serie: uscite dell'anno selezionato
- Annotation orizzontale: linea media

### Comportamento nuovo (tutti gli anni)
- Tipo: `line` con `curve: 'smooth'`
- N serie: una per ogni anno disponibile (`Uscite 2024`, `Uscite 2025`, ...)
- Asse X: invariato `['Gen', ..., 'Dic']`
- Anno parziale (es. 2026): i mesi senza dati rimangono a `0` — la linea si tronca visivamente
- Annotation media: disabilitata (non significativa su più serie)
- Chips esclusioni: nascoste (le esclusioni locali sono per anno singolo)

### Struttura dati `getMultiYearExpenseData()`
```js
[
  { name: 'Uscite 2024', data: [/* 12 valori */] },
  { name: 'Uscite 2025', data: [/* 12 valori */] },
  { name: 'Uscite 2026', data: [/* 12 valori, i futuri = 0 */] },
]
```

### Modifica a `MasterMonthlyTrendChart`
Aggiungere prop `chartType: 'bar' | 'line'` (default: `'bar'`).

In modalità `line`:
- `type="line"` su `<Chart>`
- `stroke: { show: true, width: 2, curve: 'smooth', colors: undefined }` (rimuove `colors: ['transparent']` che nasconde le linee)
- `plotOptions.bar` rimosso
- `annotations.yaxis: []` (media disabilitata)

---

## File modificati

| File | Tipo modifica |
|------|--------------|
| `src/sections/overview/master/view/master-analytics-view.js` | Aggiunta `getMultiYearAreaData()`, `getMultiYearExpenseData()`, modifica blocco `if (hideCharts)` |
| `src/sections/overview/master/master-monthly-trend-chart.js` | Aggiunta prop `chartType`, gestione modalità `line` |
| `src/sections/overview/category/category-chart-toggle.js` | Aggiunta prop `hideToggle` per nascondere i bottoni in modalità multi-anno |

**Nessun nuovo componente. Nessuna modifica al backend.**

---

## Comportamento UI finale

```
Selezione: "Tutti gli anni"

┌─────────────────────────────────────────────────────┐
│ Andamento entrate/uscite         [nessun toggle]    │
│                                                     │
│  €↑  ── Entrate 2024   ╌╌ Entrate 2025             │
│      ── Uscite 2024    ╌╌ Uscite 2025              │
│      Jan  Feb  Mar ... Nov  Dic                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Andamento mensile uscite                            │
│                                                     │
│  €↑  ── Uscite 2024                                │
│      ── Uscite 2025                                 │
│      ╌╌ Uscite 2026 (tronca a marzo)               │
│      Gen  Feb  Mar ... Nov  Dic                    │
└─────────────────────────────────────────────────────┘
```
