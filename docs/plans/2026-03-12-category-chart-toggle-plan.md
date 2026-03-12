# Category Chart Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sostituire i due grafici sovrapposti in `category-details-view.js` con un unico componente che permette di switchare tra vista a barre e vista ad area tramite toggle nell'header, con preferenza salvata in localStorage.

**Architecture:** Nuovo componente `CategoryChartToggle` che riceve i dati già elaborati come props, gestisce lo stato del tipo di grafico internamente, e mostra condizionalmente `ChartColumnMultiple` (barre) o `EcommerceMultiYearSales` (area). La view esistente passa i dati pre-elaborati e rimuove i due Grid chart.

**Tech Stack:** React 19, MUI v6 (Card, CardHeader, IconButton, Tooltip), ApexCharts (tramite componenti esistenti), localStorage API

---

### Task 1: Creare il componente `CategoryChartToggle`

**Files:**
- Create: `src/sections/overview/category/category-chart-toggle.js`

**Step 1: Creare il file con la struttura base**

```jsx
'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import EcommerceMultiYearSales from '../e-commerce/ecommerce-multi-year-sales';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'category-chart-type';

export default function CategoryChartToggle({ barSeries, barCategories, barColors, areaChart }) {
  const [chartType, setChartType] = useState(() => {
    if (typeof window === 'undefined') return 'bar';
    return localStorage.getItem(STORAGE_KEY) || 'bar';
  });

  const handleToggle = (type) => {
    setChartType(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  const toggleAction = (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Grafico a barre">
        <IconButton
          size="small"
          onClick={() => handleToggle('bar')}
          color={chartType === 'bar' ? 'primary' : 'default'}
        >
          <BarChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Grafico ad area">
        <IconButton
          size="small"
          onClick={() => handleToggle('area')}
          color={chartType === 'area' ? 'primary' : 'default'}
        >
          <ShowChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  if (chartType === 'area') {
    return (
      <EcommerceMultiYearSales
        title="Andamento entrate/uscite"
        subheader="Confronto anno corrente vs anno precedente"
        chart={areaChart}
        action={toggleAction}
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title="Entrate/Uscite per anno confrontate con l'anno precedente"
        action={toggleAction}
      />
      <Box sx={{ mt: 3, mx: 3, mb: 3 }}>
        <ChartColumnMultiple
          series={barSeries}
          categories={barCategories}
          colors={barColors}
        />
      </Box>
    </Card>
  );
}

CategoryChartToggle.propTypes = {
  barSeries: PropTypes.array,
  barCategories: PropTypes.array,
  barColors: PropTypes.array,
  areaChart: PropTypes.object,
};
```

**Step 2: Verificare che i file di import esistano**

```bash
ls "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini/src/sections/overview/e-commerce/ecommerce-multi-year-sales.js"
ls "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini/src/sections/_examples/extra/chart-view/chart-column-multiple.js"
```

Entrambi devono esistere. ✓ (già verificato in fase di design)

**Step 3: Verificare che `ShowChartIcon` sia disponibile in MUI**

```bash
grep -r "ShowChartIcon\|BarChartIcon" "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini/src" --include="*.js" -l | head -5
```

Se non trovato, controllare la lista icone MUI disponibili e usare `TimelineIcon` come alternativa per area.

---

### Task 2: Verificare la prop `action` in `EcommerceMultiYearSales`

**Files:**
- Read: `src/sections/overview/e-commerce/ecommerce-multi-year-sales.js`

**Step 1: Controllare se `EcommerceMultiYearSales` accetta la prop `action`**

Leggere il componente: se `CardHeader` usa `{...other}` o ha una prop `action` esplicita, il toggle funziona as-is.

Se NON accetta `action`, modificare `ecommerce-multi-year-sales.js`:

```jsx
// Da:
export default function EcommerceMultiYearSales({ title, subheader, chart, ...other }) {
  // ...
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

// A:
export default function EcommerceMultiYearSales({ title, subheader, chart, action, ...other }) {
  // ...
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} action={action} />
```

E aggiungere `action: PropTypes.node` alle PropTypes.

**Step 2: Commit intermedio**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
git add src/sections/overview/category/category-chart-toggle.js
git add src/sections/overview/e-commerce/ecommerce-multi-year-sales.js
git commit -m "feat: add CategoryChartToggle component with bar/area toggle"
```

---

### Task 3: Modificare `category-details-view.js`

**Files:**
- Modify: `src/sections/overview/category/view/category-details-view.js`

**Step 1: Aggiungere l'import del nuovo componente**

In cima al file, nella sezione import delle sezioni (dopo gli import MUI), aggiungere:

```jsx
import CategoryChartToggle from '../category-chart-toggle';
```

**Step 2: Rimuovere il blocco dei due grafici**

Rimuovere questo blocco dal JSX (righe ~176-201):

```jsx
<Grid size={12}>
  <Stack direction='column' spacing={3}>
    <Grid size={12}>
      <ChartColumnMultiple
        title="Entrate/Uscite per anno confrontate con l'anno precedente"
        categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
        series={getChartData(reportCategory.monthlyTotals, year, year - 1)}
        colors={['#00C853', '#FF3D00', '#2196F3', '#FFEB3B']}
      />
    </Grid>

    <Grid size={12} sx={{ mt: 3 }}>
      <EcommerceMultiYearSales
        title="Andamento annuale entrate/uscite"
        subheader="Confronto dettagliato entrate e uscite per anno"
        chart={{
          colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
          ...adaptChartDataForMultiYear(
            getChartData(reportCategory.monthlyTotals, year, year - 1),
            year,
            year - 1
          ),
        }}
      />
    </Grid>
  </Stack>
</Grid>
```

**Step 3: Aggiungere il nuovo componente al posto del blocco rimosso**

```jsx
<Grid size={12}>
  <CategoryChartToggle
    barSeries={getChartData(reportCategory.monthlyTotals, year, year - 1)}
    barCategories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
    barColors={['#00C853', '#FF3D00', '#2196F3', '#FFEB3B']}
    areaChart={{
      colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
      ...adaptChartDataForMultiYear(
        getChartData(reportCategory.monthlyTotals, year, year - 1),
        year,
        year - 1
      ),
    }}
  />
</Grid>
```

**Step 4: Rimuovere gli import non più usati**

Rimuovere queste righe se `ChartColumnMultiple` ed `EcommerceMultiYearSales` non vengono più usati direttamente nella view:

```jsx
import EcommerceMultiYearSales from '../../e-commerce/ecommerce-multi-year-sales';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';
```

**Step 5: Verificare che il linter non segnali errori**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
yarn lint 2>&1 | grep -A 3 "category-details-view\|category-chart-toggle"
```

Atteso: nessun errore su questi file. Se ci sono warning sugli import non utilizzati, rimuoverli.

**Step 6: Commit**

```bash
git add src/sections/overview/category/view/category-details-view.js
git commit -m "refactor: replace double chart with CategoryChartToggle in category details"
```

---

### Task 4: Test manuale in sviluppo

**Step 1: Avviare il dev server**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
yarn dev
```

**Step 2: Verificare il comportamento**

1. Navigare a una pagina categoria qualsiasi
2. Verificare che appaia **un solo grafico** (a barre di default)
3. Verificare che nell'header della card siano visibili le due icone toggle
4. Cliccare l'icona area → il grafico deve switchare ad area
5. Ricaricare la pagina → il grafico deve rimanere su area (localStorage persistito)
6. Navigare a un'altra categoria → deve mostrare area (preferenza globale)
7. Cliccare l'icona barre → tornare a barre
8. Ricaricare → barre persistito

**Step 3: Verificare in localStorage**

Aprire DevTools → Application → localStorage → cercare la chiave `category-chart-type` e verificare che il valore sia `'bar'` o `'area'` in base all'ultima selezione.

---

### Task 5: Commit finale e build check

**Step 1: Verifica lint completa**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
yarn lint
```

Atteso: 0 errori.

**Step 2: Build di produzione**

```bash
yarn build 2>&1 | tail -20
```

Atteso: build completata senza errori. Se ci sono type errors o import mancanti, correggerli prima di procedere.

**Step 3: Commit del design doc**

```bash
git add docs/plans/2026-03-12-category-chart-toggle-design.md
git add docs/plans/2026-03-12-category-chart-toggle-plan.md
git commit -m "docs: add design and implementation plan for category chart toggle"
```

---

## Note implementative

- **SSR safety**: Il `useState` initializer controlla `typeof window === 'undefined'` per evitare errori su Next.js App Router (SSR). Se il componente è `'use client'` questo non è strettamente necessario, ma è buona pratica.
- **`ChartColumnMultiple` senza title**: Nel `CategoryChartToggle` il titolo è gestito dal `CardHeader` esterno, quindi `ChartColumnMultiple` non riceve `title`. Verificare che il componente non mostri un header vuoto in questo caso — se necessario rimuovere il `CardHeader` interno o passare `title=""`.
- **Icone MUI**: `BarChartIcon` è in `@mui/icons-material/BarChart`, `ShowChartIcon` è in `@mui/icons-material/ShowChart`. Entrambe disponibili nel pacchetto `@mui/icons-material` già installato.
