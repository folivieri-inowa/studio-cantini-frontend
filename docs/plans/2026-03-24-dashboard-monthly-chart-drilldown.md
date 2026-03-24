# Dashboard Monthly Chart Drill-Down Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendere cliccabili le barre del grafico "Andamento mensile uscite" nella dashboard, aprendo una modal con le categorie del mese e un secondo livello con soggetti/dettagli (readonly, clone di MonthBreakdownDialog senza esclusioni).

**Architecture:**
- Task 1: Nuovo componente `MonthCategoriesReadonlyDialog` — lista categorie del mese con totali, ricava i dati dal `categoryReport` già disponibile nel parent (nessuna chiamata API), bottone azione per aprire il secondo livello, click sul nome categoria naviga a `/dashboard/master/category/[id]`.
- Task 2: Nuovo componente `MonthBreakdownReadonlyDialog` — clone di `MonthBreakdownDialog` senza checkbox esclusioni, senza chip, solo lettura. Fa la stessa chiamata API `monthBreakdown` e mostra soggetti/dettagli readonly.
- Task 3: Collegare tutto in `master-analytics-view.js` — aggiungere `onBarClick` al grafico, stato per dialog, rimuovere prop `readonly` ora che il grafico è interattivo.

**Tech Stack:** React, MUI v6, Next.js 15 App Router, axios, `useRouter` da `next/navigation`

---

### Task 1: `MonthCategoriesReadonlyDialog`

**Files:**
- Create: `studio-cantini/src/sections/overview/master/month-categories-readonly-dialog.js`

**Step 1: Creare il componente**

```jsx
'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { paths } from '../../../routes/paths';
import MonthBreakdownReadonlyDialog from './month-breakdown-readonly-dialog';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MonthCategoriesReadonlyDialog({
  open,
  onClose,
  month,        // number 1-12
  year,         // string or number
  categories,   // array of { id, name, expense } derivato dal categoryReport
  db,
  owner,
}) {
  const router = useRouter();
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const monthLabel = month ? MONTHS[month - 1] : '';

  const sortedCategories = [...(categories || [])].sort((a, b) => b.expense - a.expense);

  const totalExpense = sortedCategories.reduce((sum, c) => sum + c.expense, 0);

  const handleOpenBreakdown = (category) => {
    setSelectedCategory(category);
    setBreakdownOpen(true);
  };

  const handleNavigateCategory = (categoryId) => {
    onClose();
    router.push(paths.dashboard.master.category(categoryId));
  };

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              Uscite per categoria — {monthLabel} {year}
            </Typography>
            <Chip
              label={`Totale: ${fCurrencyEur(totalExpense)}`}
              variant="outlined"
              size="small"
            />
          </Stack>
        </DialogTitle>

        <DialogContent>
          {sortedCategories.length === 0 ? (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Nessun dato disponibile</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoria</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="center" sx={{ width: 80 }}>Dettaglio</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedCategories.map((category) => (
                      <TableRow key={category.id} hover>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            onClick={() => handleNavigateCategory(category.id)}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {capitalizeCase(category.name)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">
                            {fCurrencyEur(category.expense)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Vedi soggetti e dettagli" placement="top" arrow>
                            <IconButton size="small" onClick={() => handleOpenBreakdown(category)}>
                              <Iconify icon="solar:document-text-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {selectedCategory && (
        <MonthBreakdownReadonlyDialog
          open={breakdownOpen}
          onClose={() => setBreakdownOpen(false)}
          month={month}
          year={year}
          category={selectedCategory.id}
          categoryName={selectedCategory.name}
          db={db}
          owner={owner}
        />
      )}
    </>
  );
}

MonthCategoriesReadonlyDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    expense: PropTypes.number,
  })),
  db: PropTypes.string,
  owner: PropTypes.string,
};
```

**Step 2: Verificare che `paths.dashboard.master.category` esista**

Leggere `studio-cantini/src/routes/paths.js` e verificare che esista un path del tipo:
```js
category: (id) => `/dashboard/master/category/${id}`
```
Se non esiste, aggiungerlo nella sezione `master` dell'oggetto `paths`.

**Step 3: Commit**

```bash
git add studio-cantini/src/sections/overview/master/month-categories-readonly-dialog.js
git commit -m "feat: add MonthCategoriesReadonlyDialog — readonly categories list for monthly chart drill-down"
```

---

### Task 2: `MonthBreakdownReadonlyDialog`

**Files:**
- Create: `studio-cantini/src/sections/overview/master/month-breakdown-readonly-dialog.js`

È un clone di `month-breakdown-dialog.js` con queste differenze:
- Nessun `Checkbox` (colonna rimossa)
- Nessun `onToggleExclusion`, `onRemoveExclusion`, `onResetExclusions`
- Nessun chip "Escluso" / "Reset tutto"
- Nessuna logica di esclusione (`isExcluded`, `isSubjectFullyExcluded`, `handleToggleSubject`, `handleToggleDetail`, `handleResetSubjectExclusions`, `handleResetDetailExclusions`)
- Le righe anomalie (`error.lighter`) rimangono — sono informative
- Il chip ⚠ rimane — è informativo
- L'icona documento per vedere le transazioni rimane (apre `MonthTransactionsQuickView` in sola lettura — già readonly perché non ha esclusioni attive sulla dashboard)
- Colonne: solo `Soggetto / Dettaglio`, `Importo`, `Stato` (solo icona documento + ⚠)

**Step 1: Creare il componente**

```jsx
'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import axios, { endpoints } from '../../../utils/axios';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { useBoolean } from '../../../hooks/use-boolean';
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import MonthTransactionsQuickView from '../category/month-transactions-quick-view';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MonthBreakdownReadonlyDialog({
  open,
  onClose,
  month,
  year,
  category,
  categoryName,
  db,
  owner,
  monthlyAvg,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState({});

  const [transactionsData, setTransactionsData] = useState(null);
  const transactionsModal = useBoolean();

  const handleViewTransactions = (params) => {
    setTransactionsData({ db, owner, year, month, category, exactMonth: true, ...params });
    transactionsModal.onTrue();
  };

  const fetchBreakdown = useCallback(async () => {
    if (!open || !month) { setData(null); return; }
    setLoading(true);
    try {
      const res = await axios.post(endpoints.report.category.monthBreakdown, {
        db, owner, category, year, month,
      });
      setData(res.data);
    } catch (err) {
      console.error('month-breakdown-readonly fetch error:', err);
    }
    setLoading(false);
  }, [open, month, year, category, db, owner]);

  useEffect(() => {
    setExpanded({});
    fetchBreakdown();
  }, [fetchBreakdown]);

  const anomalyThreshold = monthlyAvg > 0 ? monthlyAvg * 2 : Infinity;
  const monthLabel = month ? MONTHS[month - 1] : '';

  return (
    <>
      <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              {capitalizeCase(categoryName || '')} — {monthLabel} {year}
            </Typography>
            {data && (
              <Chip
                label={`Totale mese: ${fCurrencyEur(data.total)}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Caricamento...</Typography>
            </Box>
          )}

          {!loading && data && (
            <TableContainer>
              <Scrollbar>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell>Soggetto / Dettaglio</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="center" sx={{ width: 80 }}>Stato</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.subjects.map(subject => {
                      const isAnomaly = subject.total > anomalyThreshold;
                      const isExpanded = !!expanded[subject.id];

                      return (
                        <Fragment key={subject.id}>
                          <TableRow
                            hover
                            sx={{ ...(isAnomaly && { bgcolor: 'error.lighter' }) }}
                          >
                            <TableCell sx={{ width: 40 }}>
                              {subject.details.length > 0 && (
                                <IconButton
                                  size="small"
                                  onClick={() => setExpanded(prev => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                                >
                                  <Iconify icon={isExpanded ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />
                                </IconButton>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="subtitle2">
                                {capitalizeCase(subject.name)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2">
                                {fCurrencyEur(subject.total)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Elenco movimenti" placement="top" arrow>
                                <IconButton size="small" onClick={() => handleViewTransactions({ subject: subject.id })}>
                                  <Iconify icon="solar:document-text-bold" />
                                </IconButton>
                              </Tooltip>
                              {isAnomaly && (
                                <Chip label="⚠" size="small" color="error" variant="soft" />
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && subject.details.map(detail => {
                            const detailAnomaly = detail.total > anomalyThreshold;
                            return (
                              <TableRow
                                key={detail.id}
                                hover
                                sx={{ ...(detailAnomaly && { bgcolor: 'error.lighter' }) }}
                              >
                                <TableCell />
                                <TableCell>
                                  <Typography variant="body2" sx={{ pl: 3 }}>
                                    {capitalizeCase(detail.name)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {fCurrencyEur(detail.total)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Elenco movimenti" placement="top" arrow>
                                    <IconButton size="small" onClick={() => handleViewTransactions({ subject: subject.id, detail: detail.id })}>
                                      <Iconify icon="solar:document-text-bold" />
                                    </IconButton>
                                  </Tooltip>
                                  {detailAnomaly && (
                                    <Chip label="⚠" size="small" color="error" variant="soft" />
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          )}

          {!loading && !data && (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">Nessun dato disponibile</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      <MonthTransactionsQuickView
        open={transactionsModal.value}
        onClose={transactionsModal.onFalse}
        data={transactionsData}
      />
    </>
  );
}

MonthBreakdownReadonlyDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  category: PropTypes.string,
  categoryName: PropTypes.string,
  db: PropTypes.string,
  owner: PropTypes.string,
  monthlyAvg: PropTypes.number,
};
```

**Step 2: Commit**

```bash
git add studio-cantini/src/sections/overview/master/month-breakdown-readonly-dialog.js
git commit -m "feat: add MonthBreakdownReadonlyDialog — readonly clone of MonthBreakdownDialog without exclusions"
```

---

### Task 3: Collegare tutto in `master-analytics-view.js`

**Files:**
- Modify: `studio-cantini/src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiungere import**

In cima al file, dopo gli import esistenti, aggiungere:

```js
import { useBoolean } from '../../../../hooks/use-boolean';
import MonthCategoriesReadonlyDialog from '../month-categories-readonly-dialog';
```

> Nota: verificare se `useBoolean` è già importato nel file prima di aggiungerlo.

**Step 2: Aggiungere stato per il dialog**

Dentro il componente, dopo gli altri `useState`, aggiungere:

```js
const monthCategoriesDialog = useBoolean();
const [selectedMonth, setSelectedMonth] = useState(null); // già esiste probabilmente — verificare
const [breakdownMonth, setBreakdownMonth] = useState(null);
```

> Nota: `selectedMonth` potrebbe già esistere nel file — verificare e non duplicare.

**Step 3: Aggiungere handler `handleBarClick`**

```js
const handleMonthBarClick = (monthIndex) => {
  setBreakdownMonth(monthIndex + 1); // monthIndex è 0-based, month è 1-based
  monthCategoriesDialog.onTrue();
};
```

**Step 4: Calcolare `categoriesForMonth` — ricavare dal `categoryReport` già disponibile**

```js
const categoriesForMonth = useMemo(() => {
  if (!breakdownMonth || !settings?.year || !settings?.owner) return [];
  const categoryReport = settings.owner?.report?.categoryReport?.[settings.year];
  if (!categoryReport) return [];
  const monthKey = breakdownMonth.toString().padStart(2, '0');
  return Object.values(categoryReport)
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      expense: parseFloat((cat.months?.[monthKey]?.expense || 0).toFixed(2)),
    }))
    .filter(cat => cat.expense > 0);
}, [breakdownMonth, settings?.year, settings?.owner]);
```

**Step 5: Aggiungere `onBarClick` al grafico e rimuovere `readonly`**

Trovare:
```jsx
<MasterMonthlyTrendChart
  title="Andamento mensile uscite"
  subheader={`Media spese mensili per l'anno ${settings.year}`}
  tooltipInfo={`Uscite mensili dell'anno ${settings.year} con indicazione della media.\nLa linea tratteggiata rappresenta la media mensile.`}
  readonly
  series={monthlyExpenseTrendData}
  categories={MONTHS_LABELS}
/>
```

Sostituire con:
```jsx
<MasterMonthlyTrendChart
  title="Andamento mensile uscite"
  subheader={`Media spese mensili per l'anno ${settings.year}`}
  tooltipInfo={`Uscite mensili dell'anno ${settings.year} con indicazione della media.\nLa linea tratteggiata rappresenta la media mensile.`}
  series={monthlyExpenseTrendData}
  categories={MONTHS_LABELS}
  onBarClick={handleMonthBarClick}
/>
```

**Step 6: Aggiungere la modal nel JSX del return**

Dopo il `</Grid>` che contiene `MasterMonthlyTrendChart`, aggiungere la modal (fuori dal Grid, dentro il Fragment):

```jsx
<MonthCategoriesReadonlyDialog
  open={monthCategoriesDialog.value}
  onClose={monthCategoriesDialog.onFalse}
  month={breakdownMonth}
  year={settings.year}
  categories={categoriesForMonth}
  db={settings?.owner?.db || settings?.db}
  owner={settings?.owner?.id}
/>
```

> Nota: verificare come viene passato `db` nel contesto settings — potrebbe essere `settings.owner.db` o `settings.db`. Cercare nel file come viene usato `db` in altri punti.

**Step 7: Aggiornare il testo accordion — rimuovere `readonly`, sezione "Clicca sulle barre" ora sempre visibile ma con testo specifico dashboard**

Nel componente `MasterMonthlyTrendChart`, ora che `readonly` non viene più passato dalla dashboard, la sezione "Clicca sulle barre" apparirà automaticamente. Il testo per la dashboard (senza menzione esclusioni) è già corretto perché `readonly` è `false` di default e il testo senza esclusioni era quello del branch `readonly`.

Verificare che il testo della sezione "Clicca sulle barre" (non-readonly) sia adeguato anche per la dashboard:
- Attuale: *"...quelle in grigio sono state escluse dal calcolo"* — questa parte non è vera per la dashboard
- Aggiornare il testo per essere generico: rimuovere il riferimento al grigio/escluse

Trovare in `master-monthly-trend-chart.js`:
```jsx
{!readonly && (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
      Clicca sulle barre
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Cliccando su una barra si apre il dettaglio del mese: l'elenco dei soggetti e dei
      dettagli che compongono quella spesa. Le righe evidenziate in rosso hanno un importo
      superiore al doppio della media mensile (⚠); quelle in grigio sono state escluse
      dal calcolo.
    </Typography>
  </Box>
)}
```

Sostituire con (rendere sempre visibile, testo generico senza menzione esclusioni per compatibilità con entrambi i contesti):
```jsx
<Box>
  <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
    Clicca sulle barre
  </Typography>
  <Typography variant="body2" color="text.secondary">
    {readonly
      ? "Cliccando su una barra si apre la lista delle categorie di quel mese con i rispettivi totali."
      : "Cliccando su una barra si apre il dettaglio del mese: l'elenco dei soggetti e dei dettagli che compongono quella spesa. Le righe evidenziate in rosso hanno un importo superiore al doppio della media mensile (⚠); quelle in grigio sono state escluse dal calcolo."}
  </Typography>
</Box>
```

> Nota: `readonly` rimane come prop nel componente per gestire la visibilità delle sezioni esclusioni — ma ora anche la dashboard avrà `readonly={false}` (default) e il grafico sarà interattivo. Il testo "clicca sulle barre" nella dashboard ora dice "apre la lista delle categorie" che è più preciso. Nell'accordion le sezioni esclusioni rimangono nascoste in modalità readonly — ma ora la dashboard NON passa readonly, quindi le mostrerà. **Correggere**: la dashboard deve ancora passare `readonly` per nascondere le sezioni esclusioni, MA deve avere `onBarClick`. Quindi `readonly` e `onBarClick` sono ortogonali — entrambi possono coesistere.

**Step 8: Commit**

```bash
git add studio-cantini/src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: wire up monthly chart bar click to MonthCategoriesReadonlyDialog in dashboard"
```

---

### Task 4: Verifica `paths.dashboard.master.category`

**Files:**
- Modify (se necessario): `studio-cantini/src/routes/paths.js`

**Step 1: Leggere il file e verificare**

Cercare nel file `paths.js` se esiste già:
```js
category: (id) => `/dashboard/master/category/${id}`
```
o simile nella sezione `master`.

**Step 2: Se non esiste, aggiungerlo**

Trovare la sezione `master` nell'oggetto `paths.dashboard` e aggiungere:
```js
category: (id) => `${ROOTS.DASHBOARD}/master/category/${id}`,
```

**Step 3: Commit (solo se modificato)**

```bash
git add studio-cantini/src/routes/paths.js
git commit -m "feat: add paths.dashboard.master.category route helper"
```

---
