import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function EcommerceMultiYearSales({ title, subheader, chart, ...other }) {
  const { colors = [], categories = [], series = [] } = chart || {};

  // Combina tutti i dati delle serie in un unico array
  const combinedSeries = [];
  
  // Attraversa tutte le serie annuali
  if (Array.isArray(series)) {
    series.forEach((yearData) => {
      // Aggiungi ogni serie di dati all'array combinedSeries
      if (yearData && Array.isArray(yearData.data)) {
        yearData.data.forEach((dataSeries) => {
          combinedSeries.push(dataSeries);
        });
      }
    });
  }

  const chartOptions = useChart({
    colors,
    legend: {
      position: 'top',
      horizontalAlign: 'right',
    },
    xaxis: {
      categories,
    },
    tooltip: {
      y: {
        formatter: (value) => {
          if (value === null || value === undefined || Number.isNaN(value)) {
            return '€0.00';
          }
          return `€${value.toFixed(2)}`;
        },
      },
    },
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />
      
      <Box sx={{ mt: 3, mx: 3, mb: 3 }}>
        <Chart
          dir="ltr"
          type="area"
          series={combinedSeries}
          options={chartOptions}
          width="100%"
          height={364}
        />
      </Box>
    </Card>
  );
}

EcommerceMultiYearSales.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  title: PropTypes.string,
};
