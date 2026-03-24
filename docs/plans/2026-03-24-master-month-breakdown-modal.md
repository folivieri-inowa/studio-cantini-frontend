# Master Month Breakdown Modal Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendere cliccabile il grafico "Andamento mensile uscite" nella dashboard principale, aprendo una modal drill-down a due livelli (categorie → soggetti/dettagli) senza confronto anni precedenti.

**Architecture:** Tre modifiche indipendenti: (1) aggiunta prop `viewOnly` a `MonthBreakdownDialog` per disabilitare esclusioni, (2) nuovo componente `MasterMonthBreakdownDialog` che mostra le categorie del mese dai dati già in memoria e apre `MonthBreakdownDialog(viewOnly)` per il drill-down, (3) collegamento del grafico esistente alla nuova modal in `master-analytics-view`.

**Tech Stack:** React, MUI v6, Next.js App Router, ApexCharts (già in uso)

---

### Task 1: Aggiunta prop `viewOnly` a `MonthBreakdownDialog`

**Files:**
- Modify: `src/sections/overview/category/month-breakdown-dialog.js`

**Step 1: Aggiungi `viewOnly` alla firma della funzione**

Apri il file. La firma è alla riga 51. Aggiungi `viewOnly = false` ai props:

```js
export default function MonthBreakdownDialog({
  open,
  onClose,
  month,
  year,
  category,
  db,
  owner,
  exclusions = [],
  onToggleExclusion,
  monthlyAvg,
  onReportRefresh,
  viewOnly = false,   // <-- AGGIUNTO
}) {
```

**Step 2: Nascondi la colonna checkbox nell'header della tabella**

Trova il `<TableHead>` (circa riga 199). La prima cella è `<TableCell padding="checkbox" />`. Rendila condizionale:

```jsx
<TableHead>
  <TableRow>
    {!viewOnly && <TableCell padding="checkbox" />}  {/* <-- condizionale */}
    <TableCell />
    <TableCell>Soggetto / Dettaglio</TableCell>
    <TableCell align="right">Importo</TableCell>
    <TableCell align="center" sx={{ width: 80 }}>Stato</TableCell>
  </TableRow>
</TableHead>
```

**Step 3: Nascondi checkbox e chip-stato nelle righe soggetto**

Nel `<TableRow>` del soggetto (circa riga 220), la cella checkbox è:
```jsx
<TableCell padding="checkbox">
  <Checkbox ... />
</TableCell>
```
Rendila condizionale:
```jsx
{!viewOnly && (
  <TableCell padding="checkbox">
    <Checkbox ... />
  </TableCell>
)}
```

I chip "Escluso" e "⚠" nella colonna Stato del soggetto: nascondi solo "Escluso":
```jsx
{!viewOnly && subjectExcluded && (
  <Chip label="Escluso" size="small" color="default" variant="soft" />
)}
```

**Step 4: Nascondi checkbox nelle righe dettaglio**

Stessa cosa per le righe detail (circa riga 286):
```jsx
{!viewOnly && (
  <TableCell padding="checkbox" sx={{ pl: 4 }}>
    <Checkbox ... />
  </TableCell>
)}
```
E il chip "Escluso" del detail:
```jsx
{!viewOnly && detailExcluded && (
  <Chip label="Escluso" size="small" color="default" variant="soft" />
)}
```

**Step 5: Aggiorna `PropTypes`**

In fondo al file, aggiungi:
```js
MonthBreakdownDialog.propTypes = {
  // ... propTypes esistenti ...
  viewOnly: PropTypes.bool,
};
```

**Step 6: Verifica manuale**

Apri la pagina categoria (`dashboard/master/category/[id]`), clicca su una barra → verifica che il `MonthBreakdownDialog` funzioni esattamente come prima (checkbox visibili, esclusioni funzionanti).

**Step 7: Commit**

```bash
git add src/sections/overview/category/month-breakdown-dialog.js
git commit -m "feat: add viewOnly prop to MonthBreakdownDialog"
```

---

### Task 2: Crea `MasterMonthBreakdownDialog`

**Files:**
- Create: `src/sections/overview/master/master-month-breakdown-dialog.js`

**Step 1: Crea il file con lo scheletro**

```jsx
'use client';

import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { paths } from '../../../routes/paths';
import { useRouter } from '../../../routes/hooks';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import { useBoolean } from '../../../hooks/use-boolean';
import Scrollbar from '../../../components/scrollbar';
import MonthBreakdownDialog from '../category/month-breakdown-dialog';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MasterMonthBreakdownDialog({
  open,
  onClose,
  month,
  year,
  owner,
  db,
  compareYears = [],
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, name }
  const categoryBreakdown = useBoolean();

  const monthLabel = month ? MONTHS[month - 1] : '';
  const paddedMonth = month ? String(month).padStart(2, '0') : null;

  // Deriva le categorie dai dati già in memoria — zero fetch
  const categories = (() => {
    if (!owner?.report?.categoryReport || !year || !paddedMonth) return [];
    const catReport = owner.report.categoryReport[year] ?? {};
    return Object.entries(catReport)
      .map(([id, cat]) => ({
        id,
        name: cat.name,
        expense: cat.months?.[paddedMonth]?.expense ?? 0,
      }))
      .filter((c) => c.expense > 0)
      .sort((a, b) => b.expense - a.expense);
  })();

  const totalExpense = categories.reduce((sum, c) => sum + c.expense, 0);

  const handleNavigateToCategory = (categoryId) => {
    const params = new URLSearchParams({
      month: String(month),
      compareYears: compareYears.join(','),
      showIncome: 'false',
      showExpense: 'true',
    });
    router.push(`${paths.dashboard.master.category.details({ id: categoryId })}?${params.toString()}`);
    onClose();
  };

  const handleOpenCategoryBreakdown = (category) => {
    setSelectedCategory(category);
    categoryBreakdown.onTrue();
  };

  return (
    <>
      <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">
              Uscite {monthLabel} {year}
            </Typography>
            {totalExpense > 0 && (
              <Chip
                label={`Totale: ${fCurrencyEur(totalExpense)}`}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {categories.length === 0 ? (
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.disabled">
                Nessun dato disponibile
              </Typography>
            </Box>
          ) : (
            <Scrollbar>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Categoria</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell align="center" sx={{ width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} hover>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, fontWeight: 500 }}
                          onClick={() => handleNavigateToCategory(cat.id)}
                        >
                          {capitalizeCase(cat.name)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fCurrencyEur(cat.expense)}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          <Tooltip title="Vai alla pagina categoria" placement="top" arrow>
                            <IconButton size="small" onClick={() => handleNavigateToCategory(cat.id)}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Dettaglio soggetti" placement="top" arrow>
                            <IconButton size="small" onClick={() => handleOpenCategoryBreakdown(cat)}>
                              <ArrowForwardIosIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Divider />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">Totale</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{fCurrencyEur(totalExpense)}</Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </Scrollbar>
          )}
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>Chiudi</Button>
        </DialogActions>
      </Dialog>

      {/* Livello 1 — Soggetti/Dettagli per categoria selezionata */}
      <MonthBreakdownDialog
        open={categoryBreakdown.value}
        onClose={categoryBreakdown.onFalse}
        month={month}
        year={year}
        category={selectedCategory?.id}
        db={db}
        owner={typeof owner?.id === 'string' ? owner.id : 'all-accounts'}
        viewOnly
        exclusions={[]}
      />
    </>
  );
}

MasterMonthBreakdownDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  month: PropTypes.number,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  owner: PropTypes.object,
  db: PropTypes.string,
  compareYears: PropTypes.array,
};
```

**Step 2: Verifica che il file sia sintatticamente corretto**

```bash
cd "/Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini"
yarn lint src/sections/overview/master/master-month-breakdown-dialog.js
```

**Step 3: Commit**

```bash
git add src/sections/overview/master/master-month-breakdown-dialog.js
git commit -m "feat: add MasterMonthBreakdownDialog with category drill-down"
```

---

### Task 3: Collega il grafico alla modal in `master-analytics-view`

**Files:**
- Modify: `src/sections/overview/master/view/master-analytics-view.js`

**Step 1: Aggiungi import**

In cima al file, dopo gli import esistenti, aggiungi:

```js
import MasterMonthBreakdownDialog from '../master-month-breakdown-dialog';
```

**Step 2: Aggiungi state per il breakdown**

Dopo `const [compareYears, setCompareYears] = useState([]);` (circa riga 217), aggiungi:

```js
const [breakdownMonth, setBreakdownMonth] = useState(null);
const breakdownDialog = useBoolean();
```

Aggiungi `useBoolean` agli import da `'../../../../hooks/use-boolean'` se non già presente.

**Step 3: Rimuovi la prop `readonly` da `MasterMonthlyTrendChart`**

Nella riga circa 975, rimuovi `readonly` dalla prop (è stata aggiunta erroneamente):

```jsx
<MasterMonthlyTrendChart
  title="Andamento mensile uscite"
  subheader={`Media spese mensili per l'anno ${settings.year}`}
  tooltipInfo={`Uscite mensili dell'anno ${settings.year} con indicazione della media.\nLa linea tratteggiata rappresenta la media mensile.`}
  series={monthlyExpenseTrendData}
  categories={MONTHS_LABELS}
  onBarClick={(idx) => {
    setBreakdownMonth(idx + 1);
    breakdownDialog.onTrue();
  }}
/>
```

**Step 4: Monta `MasterMonthBreakdownDialog`**

Subito prima del `</Container>` finale (circa riga 1021), aggiungi:

```jsx
<MasterMonthBreakdownDialog
  open={breakdownDialog.value}
  onClose={breakdownDialog.onFalse}
  month={breakdownMonth}
  year={settings.year === 'all-years' ? new Date().getFullYear() : Number(settings.year)}
  owner={settings.owner}
  db={settings.db}
  compareYears={compareYears}
/>
```

**Step 5: Lint**

```bash
yarn lint src/sections/overview/master/view/master-analytics-view.js
```

**Step 6: Test manuale**

1. Apri la dashboard principale
2. Seleziona un anno (non "Tutti gli anni" — il grafico non ha barre in quel caso)
3. Clicca su una barra del grafico "Andamento mensile uscite"
4. Verifica che si apra la modal con l'elenco categorie ordinate per importo
5. Clicca sul nome di una categoria → verifica navigazione alla pagina categoria con i parametri corretti
6. Clicca sull'icona `›` → verifica che si apra `MonthBreakdownDialog` senza checkbox
7. Clicca sull'icona documento nel MonthBreakdownDialog → verifica che si apra `MonthTransactionsQuickView`
8. Torna alla pagina categoria → verifica che `MonthBreakdownDialog` funzioni esattamente come prima (con checkbox, esclusioni)

**Step 7: Commit finale**

```bash
git add src/sections/overview/master/view/master-analytics-view.js
git commit -m "feat: wire MasterMonthBreakdownDialog to monthly trend chart"
```

---

## Note importanti

- **Anno "Tutti gli anni"**: il grafico non ha barre cliccabili in modalità `all-years` (il componente non riceve `onBarClick` in quel branch del codice) — nessun problema
- **Dati categoria**: derivati da `owner.report.categoryReport[year]` già in memoria — zero fetch aggiuntivi al livello 0
- **Retrocompatibilità**: `MonthBreakdownDialog` con `viewOnly` default `false` non cambia comportamento in `category-details-view`
- **Nessun confronto anni precedenti**: la modal della dashboard mostra solo l'anno selezionato, coerente con il grafico stesso
