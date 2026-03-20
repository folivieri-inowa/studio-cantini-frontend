# Multi-Year Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sostituire il messaggio statico "grafici non disponibili" con due grafici line multi-anno quando si seleziona "Tutti gli anni" nella dashboard master.

**Architecture:** Tre file frontend modificati, nessun backend. Si aggiungono due funzioni di aggregazione dati nella view, si estende `MasterMonthlyTrendChart` con una prop `chartType`, si aggiunge `hideToggle` a `CategoryChartToggle`. Tutti i dati esistono già nel report in-memory — nessuna nuova chiamata API.

**Tech Stack:** React 19, Next.js 15, ApexCharts (via `src/components/chart`), MUI v6

---

### Task 1: Aggiungere prop `chartType` a `MasterMonthlyTrendChart`

**Files:**
- Modify: `src/sections/overview/master/master-monthly-trend-chart.js`

**Step 1: Apri il file e individua la prop interface**

Il file è a `src/sections/overview/master/master-monthly-trend-chart.js`.
La funzione riceve queste props (riga 18-31):
```js
export default function MasterMonthlyTrendChart({
  title, subheader, series, categories, colors,
  onBarClick, exclusions, onRemoveExclusion, onResetExclusions,
  onChipClick, localExclusionsPerMonth, onLocalChipClick,
  ...other
})
```

**Step 2: Aggiungere la prop `chartType` alla destructuring**

Modifica la riga 18 aggiungendo `chartType = 'bar'`:

```js
export default function MasterMonthlyTrendChart({
  title,
  subheader,
  series = [],
  categories = [],
  colors,
  chartType = 'bar',
  onBarClick,
  exclusions = [],
  onRemoveExclusion,
  onResetExclusions,
  onChipClick,
  localExclusionsPerMonth = {},
  onLocalChipClick,
  ...other
})
```

**Step 3: Modificare `chartOptions` per gestire la modalità line**

Attualmente `chartOptions` ha (righe 44-119):
- `stroke: { show: true, width: 2, colors: ['transparent'] }` — nasconde le linee nel bar chart
- `plotOptions: { bar: { columnWidth: '36%', minHeight: 4 } }` — opzioni barre
- `annotations.yaxis` — linea media

Sostituisci il blocco `chartOptions` con:

```js
const isLine = chartType === 'line';

const chartOptions = useChart({
  colors: colors ?? (isLine ? undefined : ['#FF4842']),

  ...(onBarClick && !isLine && {
    chart: {
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          onBarClick(config.dataPointIndex);
        },
      },
      selection: { enabled: true },
    },
    states: {
      active: { filter: { type: 'darken', value: 0.75 } },
    },
  }),

  stroke: isLine
    ? { show: true, width: 2, curve: 'smooth' }
    : { show: true, width: 2, colors: ['transparent'] },

  xaxis: {
    categories,
  },

  yaxis: {
    labels: {
      formatter: (value) => {
        if (value === null || value === undefined || Number.isNaN(value)) {
          return fCurrencyEur(0);
        }
        return fCurrencyEur(parseFloat(value.toFixed(2)));
      },
    },
  },

  tooltip: {
    y: {
      formatter: (value) => {
        if (value === null || value === undefined || Number.isNaN(value)) {
          return fCurrencyEur(0);
        }
        if (!isLine && value === 0) return 'Tutto escluso';
        return fCurrencyEur(parseFloat(value.toFixed(2)));
      },
    },
  },

  ...(isLine ? {} : {
    plotOptions: {
      bar: { columnWidth: '36%', minHeight: 4 },
    },
  }),

  annotations: {
    yaxis: (!isLine && avgValue > 0)
      ? [
          {
            y: avgValue,
            borderColor: '#FF4842',
            borderWidth: 2,
            strokeDashArray: 6,
            label: {
              text: `Media: ${fCurrencyEur(avgValue)}`,
              style: { color: '#fff', background: '#FF4842' },
            },
          },
        ]
      : [],
  },
});
```

**Step 4: Modificare il `<Chart>` per usare il tipo corretto**

Alla riga 172, cambia:
```js
// DA:
<Chart dir="ltr" type="bar" series={series} options={chartOptions} width="100%" height={320} />

// A:
<Chart dir="ltr" type={chartType} series={series} options={chartOptions} width="100%" height={320} />
```

**Step 5: Aggiungere `chartType` ai PropTypes**

In fondo al file, nel blocco `MasterMonthlyTrendChart.propTypes`, aggiungi:
```js
chartType: PropTypes.oneOf(['bar', 'line']),
```

**Step 6: Commit**

```bash
cd "studio-cantini"
git add src/sections/overview/master/master-monthly-trend-chart.js
git commit -m "feat: add chartType prop to MasterMonthlyTrendChart (bar|line)"
```

---

### Task 2: Aggiungere prop `hideToggle` a `CategoryChartToggle`

**Files:**
- Modify: `src/sections/overview/category/category-chart-toggle.js`

**Step 1: Aggiungere la prop alla funzione**

```js
// DA:
export default function CategoryChartToggle({ barSeries, barCategories, barColors, areaChart }) {

// A:
export default function CategoryChartToggle({ barSeries, barCategories, barColors, areaChart, hideToggle = false }) {
```

**Step 2: Rendere il `toggleAction` condizionale**

```js
// DA:
const toggleAction = (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    ...
  </Box>
);

// A:
const toggleAction = hideToggle ? null : (
  <Box sx={{ display: 'flex', gap: 0.5 }}>
    ...
  </Box>
);
```

**Step 3: Aggiungere ai PropTypes**

```js
CategoryChartToggle.propTypes = {
  barSeries: PropTypes.array,
  barCategories: PropTypes.array,
  barColors: PropTypes.array,
  areaChart: PropTypes.object,
  hideToggle: PropTypes.bool,
};
```

**Step 4: Commit**

```bash
git add src/sections/overview/category/category-chart-toggle.js
git commit -m "feat: add hideToggle prop to CategoryChartToggle"
```

---

### Task 3: Aggiungere le funzioni di aggregazione multi-anno nella view

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiungere `getMultiYearAreaData()` dopo `getGlobalExpense()`**

Aggiungi questa funzione dopo la fine di `getGlobalExpense()` (circa riga 601):

```js
const getMultiYearAreaData = () => {
  const globalReport = settings.owner?.report?.globalReport;
  if (!globalReport) return { categories: [], series: [], colors: [] };

  const years = (settings.owner.report?.years || []).slice().sort();

  // Palette colori per anno: entrate, uscite
  const yearColors = [
    ['#4ADDDE', '#F45757'],
    ['#22C55E', '#F97316'],
    ['#A855F7', '#EAB308'],
    ['#3B82F6', '#EC4899'],
    ['#14B8A6', '#F43F5E'],
  ];

  const categories = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  const series = years.map((year, idx) => {
    const yearReport = globalReport[year];
    const months = yearReport?.months || {};
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthKey = (i + 1).toString().padStart(2, '0');
      return {
        income: parseFloat((months[monthKey]?.income || 0).toFixed(2)),
        expense: parseFloat((months[monthKey]?.expense || 0).toFixed(2)),
      };
    });

    return {
      year,
      data: [
        { name: `Entrate ${year}`, data: monthlyData.map(m => m.income) },
        { name: `Uscite ${year}`,  data: monthlyData.map(m => m.expense) },
      ],
    };
  });

  // Appiattisci i colori nell'ordine corretto
  const colors = years.flatMap((_, idx) => yearColors[idx % yearColors.length]);

  return { categories, series, colors };
};
```

**Step 2: Aggiungere `getMultiYearExpenseData()` subito dopo**

```js
const getMultiYearExpenseData = () => {
  const globalReport = settings.owner?.report?.globalReport;
  if (!globalReport) return [];

  const years = (settings.owner.report?.years || []).slice().sort();

  return years.map((year) => {
    const yearReport = globalReport[year];
    const months = yearReport?.months || {};
    const data = Array.from({ length: 12 }, (_, i) => {
      const monthKey = (i + 1).toString().padStart(2, '0');
      return parseFloat((months[monthKey]?.expense || 0).toFixed(2));
    });
    return { name: `Uscite ${year}`, data };
  });
};
```

**Step 3: Aggiungere i memo per i nuovi dati**

Dopo i memo esistenti (`chartData`, `monthlyExpenseTrendData`), aggiungi:

```js
const multiYearAreaData = useMemo(() => {
  if (!data || !settings.owner || settings.year !== 'all-years') return null;
  return getMultiYearAreaData();
}, [data, settings.owner, settings.year]);

const multiYearExpenseData = useMemo(() => {
  if (!data || !settings.owner || settings.year !== 'all-years') return [];
  return getMultiYearExpenseData();
}, [data, settings.owner, settings.year]);
```

**Step 4: Commit**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: add getMultiYearAreaData and getMultiYearExpenseData aggregation functions"
```

---

### Task 4: Sostituire il messaggio statico con i grafici multi-anno

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Localizzare il blocco `if (hideCharts)`**

Cerca il blocco (circa riga 895-937):

```js
{(() => {
  const isAllYears = settings.year === 'all-years';
  const hideCharts = isAllYears;

  if (hideCharts) {
    return (
      <Grid size={12}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            I grafici di andamento mensile non sono disponibili per periodi che coprono più anni.
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
            Seleziona un anno specifico per visualizzare l&apos;andamento mensile.
          </Typography>
        </Card>
      </Grid>
    );
  }
  // ...
```

**Step 2: Sostituire il blocco `if (hideCharts)` con i nuovi grafici**

```js
{(() => {
  const isAllYears = settings.year === 'all-years';

  if (isAllYears) {
    return (
      <>
        <Grid size={12}>
          <CategoryChartToggle
            barSeries={[]}
            barCategories={[]}
            hideToggle
            areaChart={{
              colors: multiYearAreaData?.colors || [],
              categories: multiYearAreaData?.categories || [],
              series: multiYearAreaData?.series || [],
            }}
          />
        </Grid>
        <Grid size={12}>
          <MasterMonthlyTrendChart
            title="Andamento mensile uscite"
            subheader="Confronto uscite mensili per anno"
            chartType="line"
            series={multiYearExpenseData}
            categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
          />
        </Grid>
      </>
    );
  }

  return (
    <>
      <Grid size={12}>
        <CategoryChartToggle
          barSeries={chartData || []}
          barCategories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
          areaChart={{
            colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
            categories: getYearlySalesData().chartCategories,
            series: getYearlySalesData().series,
          }}
        />
      </Grid>
      <Grid size={12}>
        <MasterMonthlyTrendChart
          title="Andamento mensile uscite"
          subheader={`Media spese mensili per l'anno ${settings.year}`}
          series={monthlyExpenseTrendData}
          categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
        />
      </Grid>
    </>
  );
})()}
```

**Step 3: Verificare che `multiYearAreaData` e `multiYearExpenseData` siano nel closure**

Il blocco `{(() => { ... })()}` è dentro il JSX che ha accesso ai memo — nessuna importazione aggiuntiva necessaria.

**Step 4: Avviare il dev server e verificare visivamente**

```bash
yarn dev
```

Aprire `http://localhost:3032`, selezionare "Tutti gli anni" e verificare che:
- Appaia il grafico area con linee per ogni anno
- Appaia il grafico line con uscite per anno sovrapposte
- Il toggle barre/area sia nascosto in modalità multi-anno
- Selezionando un anno specifico i grafici originali tornino

**Step 5: Commit finale**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: show multi-year line charts when all-years is selected"
```

---

## Riepilogo commit attesi

```
feat: add chartType prop to MasterMonthlyTrendChart (bar|line)
feat: add hideToggle prop to CategoryChartToggle
feat: add getMultiYearAreaData and getMultiYearExpenseData aggregation functions
feat: show multi-year line charts when all-years is selected
```
