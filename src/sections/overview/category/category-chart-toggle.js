'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import EcommerceMultiYearSales from '../e-commerce/ecommerce-multi-year-sales';
import ChartColumnMultiple from '../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'category-chart-type';

export default function CategoryChartToggle({ barSeries, barCategories, barColors, areaChart }) {
  const [chartType, setChartType] = useState(() => {
    if (typeof window === 'undefined') return 'bar';
    return localStorage.getItem(STORAGE_KEY) || 'bar';
  });

  const handleToggle = (type) => {
    setChartType(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  const toggleAction = (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Grafico a barre">
        <IconButton
          size="small"
          onClick={(e) => { e.preventDefault(); handleToggle('bar'); }}
          color={chartType === 'bar' ? 'primary' : 'default'}
        >
          <BarChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Grafico ad area">
        <IconButton
          size="small"
          onClick={(e) => { e.preventDefault(); handleToggle('area'); }}
          color={chartType === 'area' ? 'primary' : 'default'}
        >
          <ShowChartIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  if (chartType === 'area') {
    return (
      <EcommerceMultiYearSales
        title="Andamento entrate/uscite"
        subheader="Confronto anno corrente vs anno precedente"
        chart={areaChart}
        action={toggleAction}
      />
    );
  }

  return (
    <ChartColumnMultiple
      title="Entrate/Uscite per anno confrontate con l'anno precedente"
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
  areaChart: PropTypes.object,
};
