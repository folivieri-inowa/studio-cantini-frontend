'use client';

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import Chart, { useChart } from '../../../components/chart';
import { fCurrencyEur } from '../../../utils/format-number';
import EcommerceMultiYearSales from '../e-commerce/ecommerce-multi-year-sales';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'category-chart-type';

// ----------------------------------------------------------------------

function buildCumulative(data) {
  let sum = 0;
  return (data || []).map(v => {
    if (v === null || v === undefined) return null;
    sum += v;
    return parseFloat(sum.toFixed(2));
  });
}

function CumulativeChart({ chart, subheader, tooltipInfo, title, action }) {
  const { colors = [], categories = [], series = [] } = chart || {};

  const cumulativeSeries = [];
  if (Array.isArray(series)) {
    series.forEach((yearData) => {
      if (yearData && Array.isArray(yearData.data)) {
        yearData.data.forEach((dataSeries) => {
          cumulativeSeries.push({
            name: dataSeries.name,
            data: buildCumulative(dataSeries.data),
          });
        });
      }
    });
  }

  const chartOptions = useChart({
    colors,
    stroke: { width: 2, curve: 'smooth' },
    xaxis: { categories },
    yaxis: { labels: { formatter: v => fCurrencyEur(v ?? 0) } },
    tooltip: { y: { formatter: v => fCurrencyEur(v ?? 0) } },
    markers: { size: 3 },
    legend: { position: 'top', horizontalAlign: 'right' },
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
    <Card>
      <CardHeader title={title} subheader={subheaderNode} action={action} />
      <Box sx={{ mt: 3, mx: 3, mb: 3 }}>
        <Chart
          dir="ltr"
          type="line"
          series={cumulativeSeries}
          options={chartOptions}
          width="100%"
          height={364}
        />
      </Box>
    </Card>
  );
}

CumulativeChart.propTypes = {
  chart: PropTypes.object,
  subheader: PropTypes.string,
  tooltipInfo: PropTypes.string,
  title: PropTypes.string,
  action: PropTypes.node,
};

// ----------------------------------------------------------------------

export default function CategoryChartToggle({ barSeries, barCategories, barColors, areaChart, areaSubheader, areaTooltipInfo, barSubheader, barTooltipInfo, cumulativeTooltipInfo, hideToggle = false }) {
  const [chartType, setChartType] = useState(() => {
    if (hideToggle) return 'area';
    if (typeof window === 'undefined') return 'area';
    return localStorage.getItem(STORAGE_KEY) || 'area';
  });

  // Quando hideToggle diventa true (es. passaggio a "tutti gli anni"),
  // forziamo sempre il tipo 'area' perché il grafico a barre non ha dati.
  useEffect(() => {
    if (hideToggle) setChartType('area');
  }, [hideToggle]);

  const handleToggle = (type) => {
    setChartType(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  const toggleAction = hideToggle ? null : (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Andamento entrate/uscite">
        <IconButton
          size="small"
          onClick={(e) => { e.preventDefault(); handleToggle('area'); }}
          color={chartType === 'area' ? 'primary' : 'default'}
        >
          <ShowChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Andamento entrate/uscite">
        <IconButton
          size="small"
          onClick={(e) => { e.preventDefault(); handleToggle('bar'); }}
          color={chartType === 'bar' ? 'primary' : 'default'}
        >
          <BarChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Andamento cumulativo">
        <IconButton
          size="small"
          onClick={(e) => { e.preventDefault(); handleToggle('cumulative'); }}
          color={chartType === 'cumulative' ? 'primary' : 'default'}
        >
          <TrendingUpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  if (chartType === 'area') {
    return (
      <EcommerceMultiYearSales
        title="Andamento entrate/uscite"
        subheader={areaSubheader}
        tooltipInfo={areaTooltipInfo}
        chart={areaChart}
        action={toggleAction}
      />
    );
  }

  if (chartType === 'cumulative') {
    return (
      <CumulativeChart
        title="Andamento cumulativo entrate/uscite"
        subheader={areaSubheader}
        tooltipInfo={cumulativeTooltipInfo}
        chart={areaChart}
        action={toggleAction}
      />
    );
  }

  return (
    <ChartColumnMultiple
      title="Andamento entrate/uscite precedente"
      subheader={barSubheader}
      tooltipInfo={barTooltipInfo}
      series={barSeries}
      categories={barCategories}
      colors={barColors}
      action={toggleAction}
    />
  );
}

CategoryChartToggle.propTypes = {
  barSeries: PropTypes.array,
  barCategories: PropTypes.array,
  barColors: PropTypes.array,
  barSubheader: PropTypes.string,
  barTooltipInfo: PropTypes.string,
  areaChart: PropTypes.object,
  areaSubheader: PropTypes.string,
  areaTooltipInfo: PropTypes.string,
  cumulativeTooltipInfo: PropTypes.string,
  hideToggle: PropTypes.bool,
};
