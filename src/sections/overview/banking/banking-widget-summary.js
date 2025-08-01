import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fPercent, fCurrencyEur } from 'src/utils/format-number';

import { bgGradient } from 'src/theme/css';

import Iconify from 'src/components/iconify';
import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function BankingWidgetSummary({
  title,
  total,
  icon,
  percent,
  color = 'primary',
  chart,
  description,
  sx,
  ...other
}) {
  const theme = useTheme();

  const { series = [], options = {} } = chart || {};

  const chartOptions = useChart({
    colors: [theme.palette[color].dark],
    chart: {
      sparkline: {
        enabled: true,
      },
    },
    xaxis: {
      labels: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
    },
    tooltip: {
      marker: {
        show: false,
      },
      y: {
        formatter: (value) => fCurrencyEur(value),
        title: {
          formatter: () => '',
        },
      },
    },
    ...options,
  });

  return (
    <Stack
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette[color].light, 0.2),
          endColor: alpha(theme.palette[color].main, 0.2),
        }),
        width: 1,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        color: `${color}.darker`,
        backgroundColor: 'common.white',
        ...sx,
      }}
      {...other}
    >
      <Iconify
        icon={icon}
        sx={{
          p: 1.5,
          top: 24,
          right: 24,
          width: 48,
          height: 48,
          borderRadius: '50%',
          position: 'absolute',
          color: `${color}.lighter`,
          bgcolor: `${color}.dark`,
        }}
      />

      <Stack spacing={1} sx={{ p: 3 }}>
        <Typography variant="subtitle2">{title}</Typography>

        <Typography variant="h3">{fCurrencyEur(total)}</Typography>

        {description ? (
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {description}
          </Typography>
        ) : (
          <Stack
            spacing={0.5}
            direction="row"
            flexWrap="wrap"
            alignItems="center"
            sx={{ typography: 'body2' }}
          >
            <Iconify icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />

            <Box sx={{ typography: 'subtitle2' }}>
              {percent > 0 && '+'}
              {fPercent(percent)}
            </Box>

            <Box sx={{ opacity: 0.8 }}>rispetto il mese precedente</Box>
          </Stack>
        )}
      </Stack>

      <Chart
        dir="ltr"
        type="area"
        series={[{ data: Array.isArray(series) ? series : [] }]}
        options={chartOptions}
        width="100%"
        height={120}
      />
    </Stack>
  );
}

BankingWidgetSummary.propTypes = {
  chart: PropTypes.object,
  color: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  percent: PropTypes.number,
  sx: PropTypes.object,
  title: PropTypes.string,
  total: PropTypes.number,
};
