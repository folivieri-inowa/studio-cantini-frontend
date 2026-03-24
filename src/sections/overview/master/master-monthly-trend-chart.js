import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import Chart, { useChart } from 'src/components/chart';

import { fCurrencyEur } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

export default function MasterMonthlyTrendChart({
  title,
  subheader,
  tooltipInfo,
  showGuide = false,
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
}) {
  // --- Average computation -------------------------------------------
  // Use the first series as the expense data (bar series)
  const expenseData = series[0]?.data ?? [];

  const nonZeroValues = expenseData.filter((v) => typeof v === 'number' && v > 0);
  const avgValue =
    nonZeroValues.length > 0
      ? nonZeroValues.reduce((sum, v) => sum + v, 0) / nonZeroValues.length
      : 0;

  // --- Chart options --------------------------------------------------
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

  // --- Empty state ----------------------------------------------------
  const hasData = series.length > 0 && expenseData.length > 0;

  const subheaderNode = (subheader || tooltipInfo) ? (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      {subheader && (
        <Typography variant="body2" color="text.secondary">
          {subheader}
        </Typography>
      )}
      {tooltipInfo && (
        <Tooltip
          title={<span style={{ whiteSpace: 'pre-line' }}>{tooltipInfo}</span>}
          placement="bottom"
          arrow
        >
          <IconButton size="small" sx={{ p: 0, opacity: 0.5 }}>
            <span style={{ fontSize: '0.8rem' }}>ⓘ</span>
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  ) : undefined;

  return (
    <Card {...other}>
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
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Come leggere questo grafico
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
                Il grafico
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mostra le uscite mensili della categoria per l'anno selezionato. Ogni barra rappresenta
                la spesa totale di quel mese. La linea tratteggiata indica la media mensile calcolata
                sui mesi con almeno una spesa.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
                Clicca sulle barre
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cliccando su una barra si apre il dettaglio del mese: l'elenco di tutte le voci che
                compongono quella spesa. Le voci evidenziate sono incluse nel totale; quelle in grigio
                sono state escluse.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
                Escludere una voce
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Nel dettaglio del mese puoi escludere singole voci dal calcolo cliccando sulla riga.
                La voce diventa grigia e la barra si aggiorna. Le esclusioni appaiono come chip sotto
                il titolo del grafico.
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
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
        <Stack direction="row" spacing={1} sx={{ mx: 3, mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
          {exclusions.map((exc) => {
            const key = `${exc.subjectId}:${exc.detailId}:${exc.month}`;
            const label = `${exc.detailName || exc.subjectName} (${MONTHS[exc.month - 1]})`;
            return (
              <Chip
                key={key}
                label={label}
                size="small"
                variant="outlined"
                color="error"
                onDelete={() => onRemoveExclusion(exc)}
                onClick={() => onChipClick && onChipClick(exc)}
              />
            );
          })}
          <Chip
            label="Reset tutto"
            size="small"
            variant="soft"
            color="default"
            onDelete={onResetExclusions}
          />
        </Stack>
      )}

      {Object.keys(localExclusionsPerMonth).length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mx: 3, mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
          {Object.entries(localExclusionsPerMonth).map(([month, count]) => (
            <Chip
              key={`local-exc-${month}`}
              label={`${MONTHS[parseInt(month, 10) - 1]} (${count} esclus${count === 1 ? 'a' : 'e'})`}
              size="small"
              variant="outlined"
              color="warning"
              onClick={() => onLocalChipClick && onLocalChipClick(parseInt(month, 10))}
            />
          ))}
        </Stack>
      )}

      {hasData ? (
        <Box sx={{ mt: 3, mx: 3, ...(onBarClick && { '& .apexcharts-bar-series': { cursor: 'pointer' }, '& .apexcharts-series path': { cursor: 'pointer' } }) }}>
          <Chart
            dir="ltr"
            type={chartType}
            series={series}
            options={chartOptions}
            width="100%"
            height={320}
          />
        </Box>
      ) : (
        <Box
          sx={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
          }}
        >
          <Typography variant="body2">Nessun dato disponibile</Typography>
        </Box>
      )}
    </Card>
  );
}

MasterMonthlyTrendChart.propTypes = {
  title: PropTypes.string,
  subheader: PropTypes.string,
  tooltipInfo: PropTypes.string,
  showGuide: PropTypes.bool,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      data: PropTypes.arrayOf(PropTypes.number),
    })
  ),
  categories: PropTypes.arrayOf(PropTypes.string),
  colors: PropTypes.arrayOf(PropTypes.string),
  chartType: PropTypes.oneOf(['bar', 'line']),
  onBarClick: PropTypes.func,
  exclusions: PropTypes.array,
  onRemoveExclusion: PropTypes.func,
  onResetExclusions: PropTypes.func,
  onChipClick: PropTypes.func,
  localExclusionsPerMonth: PropTypes.object,
  onLocalChipClick: PropTypes.func,
};
