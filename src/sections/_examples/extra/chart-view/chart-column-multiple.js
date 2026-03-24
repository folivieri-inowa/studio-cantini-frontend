import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Chart, { useChart } from 'src/components/chart';

import { fCurrencyEur } from '../../../../utils/format-number';

// ----------------------------------------------------------------------

export default function ChartColumnMultiple({ series = [], title, subheader, tooltipInfo, categories = [], colors, action, ...other }) {
  const chartOptions = useChart({
    colors,
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
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
          return fCurrencyEur(parseFloat(value.toFixed(2)));
        },
      },
    },
    plotOptions: { bar: { columnWidth: '36%' } },
  });

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
      <CardHeader
        title={title}
        subheader={subheaderNode}
        action={action}
      />
      <Box sx={{ mt: 3, mx: 3 }}>
        <Chart
          dir="ltr"
          type="bar"
          series={Array.isArray(series) ? series : []}
          options={chartOptions}
          width="100%"
          height={320}
        />
      </Box>
    </Card>
  );
}

ChartColumnMultiple.propTypes = {
  series: PropTypes.array,
  title: PropTypes.string,
  subheader: PropTypes.string,
  tooltipInfo: PropTypes.string,
  categories: PropTypes.array,
  colors: PropTypes.array,
  action: PropTypes.node,
};
