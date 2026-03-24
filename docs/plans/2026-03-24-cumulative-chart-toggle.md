# Cumulative Chart Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggiungere un terzo grafico "Andamento cumulativo" al toggle in `CategoryChartToggle`, affiancando le due icone esistenti con una terza icona `TrendingUpIcon`.

**Architecture:** Modifica solo `category-chart-toggle.js`. Il terzo tipo `cumulative` riusa i dati `areaChart` già passati, trasformandoli in serie cumulative lato frontend con un nuovo componente `EcommerceCumulativeSales` (Card + Chart line). Nessun endpoint backend nuovo.

**Tech Stack:** React, MUI, ApexCharts (via `Chart`/`useChart`), `localStorage` per persistenza

---

### Task 1: Aggiungere il terzo tipo `cumulative` a `category-chart-toggle.js`

**Files:**
- Modify: `src/sections/overview/category/category-chart-toggle.js`

**Step 1: Aggiungere import TrendingUpIcon e il componente cumulativo**

Aggiungere in cima agli import:
```js
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Chart, { useChart } from '../../../components/chart';
import { fCurrencyEur } from '../../../utils/format-number';
```

**Step 2: Creare il componente `CumulativeChart` interno**

Funzione helper che trasforma le serie area in cumulative:
```js
function buildCumulative(data) {
  let sum = 0;
  return data.map(v => {
    if (v === null || v === undefined) return null;
    sum += v;
    return parseFloat(sum.toFixed(2));
  });
}

function CumulativeChart({ chart, subheader, tooltipInfo, action, title }) {
  const { colors = [], categories = [], series = [] } = chart || {};

  // Appiattisce le serie multi-anno e calcola il cumulativo per ciascuna
  const cumulativeSeries = [];
  if (Array.isArray(series)) {
    series.forEach((yearData) => {
      if (yearData && Array.isArray(yearData.data)) {
        yearData.data.forEach((dataSeries) => {
          cumulativeSeries.push({
            name: dataSeries.name,
            data: buildCumulative(dataSeries.data),
          });
        });
      }
    });
  }

  const chartOptions = useChart({
    colors,
    stroke: { width: 2, curve: 'smooth' },
    xaxis: { categories },
    yaxis: { labels: { formatter: v => fCurrencyEur(v ?? 0) } },
    tooltip: { y: { formatter: v => fCurrencyEur(v ?? 0) } },
    markers: { size: 3 },
    legend: { position: 'top', horizontalAlign: 'right' },
  });

  return (
    <Card>
      <CardHeader title={title} subheader={subheader} action={action} />
      <Box sx={{ mt: 3, mx: 3, mb: 3 }}>
        <Chart dir="ltr" type="line" series={cumulativeSeries} options={chartOptions} width="100%" height={364} />
      </Box>
    </Card>
  );
}
```

**Step 3: Aggiungere la terza icona al toggle**

Nel blocco `toggleAction`, aggiungere dopo il secondo `Tooltip`:
```jsx
<Tooltip title="Andamento cumulativo">
  <IconButton
    size="small"
    onClick={(e) => { e.preventDefault(); handleToggle('cumulative'); }}
    color={chartType === 'cumulative' ? 'primary' : 'default'}
  >
    <TrendingUpIcon fontSize="small" />
  </IconButton>
</Tooltip>
```

**Step 4: Aggiungere il render del tipo `cumulative`**

Prima del `return` finale aggiungere:
```js
if (chartType === 'cumulative') {
  return (
    <CumulativeChart
      title="Andamento cumulativo entrate/uscite"
      subheader={areaSubheader}
      tooltipInfo={areaTooltipInfo}
      chart={areaChart}
      action={toggleAction}
    />
  );
}
```

**Step 5: Aggiungere PropTypes per `CumulativeChart`**

```js
CumulativeChart.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  tooltipInfo: PropTypes.string,
  title: PropTypes.string,
  action: PropTypes.node,
};
```

**Step 6: Verificare visivamente**

Aprire la dashboard categoria, verificare che:
- Le 3 icone siano affiancate
- Il click su `TrendingUpIcon` mostri il grafico cumulativo
- La preferenza venga salvata in `localStorage`
- `hideToggle` forzi ancora `area`
