import PropTypes from 'prop-types';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function ChartColumnStacked({ series, categories }) {
  const chartOptions = useChart({
    chart: {
      stacked: true,
      zoom: {
        enabled: false,
      },
    },
    legend: {
      itemMargin: {
        vertical: 8,
      },
      position: 'top',
      offsetY: 20,
    },
    plotOptions: {
      bar: {
        columnWidth: '26%',
      },
    },
    stroke: {
      show: false,
    },
    xaxis: {
      categories: categories || [
        'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
        'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
      ],
    },
  });

  return (
    <Chart dir="ltr" type="bar" series={series} options={chartOptions} width="100%" height={320} />
  );
}

ChartColumnStacked.propTypes = {
  series: PropTypes.array,
  categories: PropTypes.array,
};
