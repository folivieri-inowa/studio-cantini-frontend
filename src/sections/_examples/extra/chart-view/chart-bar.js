import PropTypes from 'prop-types';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function ChartBar({ series, categories }) {
  const chartOptions = useChart({
    stroke: { show: false },
    plotOptions: {
      bar: { horizontal: true, barHeight: '35%' },
    },
    xaxis: {
      categories: categories || [
        'Italy',
        'Japan',
        'China',
        'Canada',
        'France',
        'Germany',
        'South Korea',
        'Netherlands',
        'United States',
        'United Kingdom',
      ],
    },
  });

  return (
    <Chart
      dir="ltr"
      type="bar"
      series={[{ data: series }]}
      options={chartOptions}
      width="100%"
      height={320}
    />
  );
}

ChartBar.propTypes = {
  series: PropTypes.array,
  categories: PropTypes.array,
};
