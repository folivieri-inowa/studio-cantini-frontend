import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import Chart, { useChart } from 'src/components/chart';

import Box from '@mui/material/Box';
import { fCurrencyEur } from '../../../../utils/format-number';

// ----------------------------------------------------------------------

export default function ChartColumnMultiple({ series, title, subheader, categories, ...other }) {
  const chartOptions = useChart({
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
        formatter: (value) => `${fCurrencyEur(parseFloat(value.toFixed(2)))}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value) => `${fCurrencyEur(parseFloat(value.toFixed(2)))}`,
      },
    },
    plotOptions: { bar: { columnWidth: '36%' } },
  });

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        />
      <Box sx={{ mt: 3, mx: 3 }}>
        <Chart dir="ltr" type="bar" series={series} options={chartOptions} width="100%" height={320} />
      </Box>
    </Card>
  );
}

ChartColumnMultiple.propTypes = {
  series: PropTypes.array,
  title: PropTypes.string,
  subheader: PropTypes.string,
  categories: PropTypes.array,
};
