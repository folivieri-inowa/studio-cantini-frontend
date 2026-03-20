import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import Chart, { useChart } from 'src/components/chart';

import { fCurrencyEur } from 'src/utils/format-number';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

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

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

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
