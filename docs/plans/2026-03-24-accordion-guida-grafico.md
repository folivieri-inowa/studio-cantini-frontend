# Accordion Guida Grafico Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggiungere un accordion collassato sotto il CardHeader di `MasterMonthlyTrendChart` che spiega all'utente come leggere il grafico, come usare le barre cliccabili, come funzionano le esclusioni e come ripristinarle.

**Architecture:** Modificare solo `master-monthly-trend-chart.js` — aggiungere un `Accordion` MUI collassato di default con 4 sezioni di testo. Nessun nuovo file, nessun nuovo prop obbligatorio. Prop opzionale `showGuide` (default `false`) per aprirlo di default in futuro.

**Tech Stack:** React, MUI v6 (`Accordion`, `AccordionSummary`, `AccordionDetails`, `Typography`, `Box`)

---

### Task 1: Aggiungere l'Accordion in `MasterMonthlyTrendChart`

**Files:**
- Modify: `studio-cantini/src/sections/overview/master/master-monthly-trend-chart.js`

**Step 1: Aggiungere gli import MUI mancanti**

In cima al file, aggiungere agli import esistenti:

```js
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
```

> Nota: `ExpandMoreIcon` viene da `@mui/icons-material` già installato nel progetto.

**Step 2: Aggiungere il prop `showGuide` alla firma del componente**

Trovare la firma del componente:

```js
export default function MasterMonthlyTrendChart({
  title,
  subheader,
  tooltipInfo,
  series = [],
  ...
```

Aggiungere `showGuide = false` dopo `tooltipInfo`:

```js
export default function MasterMonthlyTrendChart({
  title,
  subheader,
  tooltipInfo,
  showGuide = false,
  series = [],
  ...
```

**Step 3: Aggiungere il blocco JSX dell'accordion nel return**

Trovare nel `return` il blocco:

```jsx
<CardHeader title={title} subheader={subheaderNode} />

{exclusions.length > 0 && (
```

Inserire l'accordion **tra** `CardHeader` e il blocco `exclusions`:

```jsx
<CardHeader title={title} subheader={subheaderNode} />

<Accordion
  defaultExpanded={showGuide}
  disableGutters
  elevation={0}
  square
  sx={{
    mx: 3,
    mt: 1,
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
    '&:before': { display: 'none' },
    backgroundColor: 'background.neutral',
  }}
>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography variant="body2" fontWeight={600}>
      Come leggere questo grafico
    </Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Il grafico
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Mostra le uscite mensili della categoria per l'anno selezionato. Ogni barra rappresenta
          la spesa totale di quel mese. La linea tratteggiata indica la media mensile calcolata
          sui mesi con almeno una spesa.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Clicca sulle barre
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Cliccando su una barra si apre il dettaglio del mese: l'elenco di tutte le voci che
          compongono quella spesa. Le voci evidenziate sono incluse nel totale; quelle in grigio
          sono state escluse.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Escludere una voce
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Nel dettaglio del mese puoi escludere singole voci dal calcolo cliccando sulla riga.
          La voce diventa grigia e la barra si aggiorna. Le esclusioni appaiono come chip sotto
          il titolo del grafico.
        </Typography>
      </Box>

      <Box>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Ripristinare le voci escluse
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Puoi rimuovere una singola esclusione cliccando la ✕ sul chip corrispondente, oppure
          azzerare tutto con il chip "Reset tutto".
        </Typography>
      </Box>

    </Box>
  </AccordionDetails>
</Accordion>

{exclusions.length > 0 && (
```

**Step 4: Aggiungere `showGuide` ai PropTypes**

Trovare il blocco `MasterMonthlyTrendChart.propTypes` e aggiungere:

```js
showGuide: PropTypes.bool,
```

dopo `tooltipInfo: PropTypes.string,`.

**Step 5: Verifica visiva**

Aprire la pagina `/dashboard/master/category/[id]`, scorrere fino al grafico "Andamento mensile uscite" e verificare:
- L'accordion è presente e collassato di default
- Cliccando si apre con le 4 sezioni
- Il testo è leggibile e ben spaziato
- Lo stile è sobrio e coerente con il resto della UI

**Step 6: Commit**

```bash
git add studio-cantini/src/sections/overview/master/master-monthly-trend-chart.js
git commit -m "feat: add collapsible guide accordion to MasterMonthlyTrendChart"
```

---
