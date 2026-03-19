'use client';

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axios, { endpoints } from '../../../utils/axios';
import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import Iconify from '../../../components/iconify';
import Chart, { useChart } from '../../../components/chart';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

// Aggrega i dati mensili per-detail in una serie unica per anno (somma tutti i detail)
function buildYearSeries(seriesArray, year, selectedMonth) {
  if (!seriesArray || seriesArray.length === 0) return Array(12).fill(0);
  const totals = Array(12).fill(0);
  seriesArray.forEach(s => {
    s.data.forEach((val, idx) => {
      // Limita ai mesi YTD
      if (idx < selectedMonth) totals[idx] += Math.abs(val ?? 0);
    });
  });
  return totals;
}

// Calcola media mensile (solo mesi con dati fino a selectedMonth)
function calcAvg(monthlyData, selectedMonth) {
  const relevant = monthlyData.slice(0, selectedMonth).filter(v => v > 0);
  if (!relevant.length) return 0;
  return relevant.reduce((s, v) => s + v, 0) / relevant.length;
}

// Calcola YTD cumulativo
function buildCumulativeSeries(monthlyData, selectedMonth) {
  const result = Array(12).fill(null);
  let cumul = 0;
  for (let i = 0; i < selectedMonth; i += 1) {
    cumul += monthlyData[i] ?? 0;
    result[i] = parseFloat(cumul.toFixed(2));
  }
  return result;
}

function BarAvgChart({ currentYear, prevYear, currentData, prevData, selectedMonth }) {
  const avg = calcAvg(currentData, selectedMonth);
  const prevAvg = calcAvg(prevData, selectedMonth);

  const series = [
    { name: `Uscite ${currentYear}`, data: currentData.map((v, i) => i < selectedMonth ? parseFloat(v.toFixed(2)) : null) },
    { name: `Uscite ${prevYear}`, data: prevData.map((v, i) => i < selectedMonth ? parseFloat(v.toFixed(2)) : null) },
  ];

  const chartOptions = useChart({
    colors: ['#FF4842', '#FFA48D'],
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: { categories: MONTH_LABELS },
    yaxis: {
      labels: { formatter: v => fCurrencyEur(v ?? 0) },
    },
    tooltip: { y: { formatter: v => fCurrencyEur(v ?? 0) } },
    plotOptions: { bar: { columnWidth: '40%' } },
    annotations: {
      yaxis: [
        avg > 0 ? {
          y: avg,
          borderColor: '#FF4842',
          borderWidth: 2,
          strokeDashArray: 6,
          label: { text: `Media ${currentYear}: ${fCurrencyEur(avg)}`, style: { color: '#fff', background: '#FF4842' } },
        } : null,
        prevAvg > 0 ? {
          y: prevAvg,
          borderColor: '#FFA48D',
          borderWidth: 2,
          strokeDashArray: 4,
          label: { text: `Media ${prevYear}: ${fCurrencyEur(prevAvg)}`, style: { color: '#fff', background: '#FFA48D' } },
        } : null,
      ].filter(Boolean),
    },
  });

  return (
    <Chart dir="ltr" type="bar" series={series} options={chartOptions} width="100%" height={280} />
  );
}

BarAvgChart.propTypes = {
  currentYear: PropTypes.number,
  prevYear: PropTypes.number,
  currentData: PropTypes.array,
  prevData: PropTypes.array,
  selectedMonth: PropTypes.number,
};

function LineChart({ currentYear, prevYear, currentData, prevData, selectedMonth }) {
  const series = [
    { name: `YTD ${currentYear}`, data: buildCumulativeSeries(currentData, selectedMonth) },
    { name: `YTD ${prevYear}`, data: buildCumulativeSeries(prevData, selectedMonth) },
  ];

  const chartOptions = useChart({
    colors: ['#FF4842', '#FFA48D'],
    stroke: { width: [3, 2], dashArray: [0, 4] },
    xaxis: { categories: MONTH_LABELS },
    yaxis: { labels: { formatter: v => fCurrencyEur(v ?? 0) } },
    tooltip: { y: { formatter: v => fCurrencyEur(v ?? 0) } },
    markers: { size: 4 },
  });

  return (
    <Chart dir="ltr" type="line" series={series} options={chartOptions} width="100%" height={280} />
  );
}

LineChart.propTypes = {
  currentYear: PropTypes.number,
  prevYear: PropTypes.number,
  currentData: PropTypes.array,
  prevData: PropTypes.array,
  selectedMonth: PropTypes.number,
};

// ----------------------------------------------------------------------

export default function SubjectChartQuickView({ data, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);

  // Usa stringify come dipendenza per evitare loop su object reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataKey = JSON.stringify(data);

  useEffect(() => {
    if (!open || !data) { setChartData(null); return; }

    const fetchChart = async () => {
      setLoading(true);
      try {
        const response = await axios.post(endpoints.report.category.subject.chart, {
          subject: data.subject,
          category: data.category,
          year: data.year,
          owner: data.owner,
          db: data.db,
        });
        // Il backend restituisce direttamente { subject, subjectName, currentYearSeries, prevYearSeries, ... }
        const payload = response.data?.data ?? response.data;
        if (payload) setChartData(payload);
      } catch (err) {
        console.error('Error fetching subject chart:', err);
      }
      setLoading(false);
    };

    fetchChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dataKey]);

  const selectedMonth = data?.month ? parseInt(data.month, 10) : 12;
  const periodLabel = (() => {
    if (!data?.year || data.year === 'all-years') return '';
    if (selectedMonth === 12) return `Anno ${data.year}`;
    return `Gen – ${MONTHS[selectedMonth - 1]} ${data.year}`;
  })();

  const currentData = chartData
    ? buildYearSeries(chartData.currentYearSeries, chartData.currentYear, selectedMonth)
    : Array(12).fill(0);

  const prevData = chartData
    ? buildYearSeries(chartData.prevYearSeries, chartData.prevYear, selectedMonth)
    : Array(12).fill(0);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="h5">
              Analisi spese — {chartData?.subjectName ? capitalizeCase(chartData.subjectName) : '...'}
            </Typography>
            {data?.categoryName && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Categoria: {capitalizeCase(data.categoryName)}
              </Typography>
            )}
          </Box>
          {periodLabel && (
            <Chip
              icon={<Iconify icon="solar:calendar-bold" />}
              label={periodLabel}
              size="small"
              color="primary"
              variant="soft"
              sx={{ mt: 0.5 }}
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.disabled">Caricamento...</Typography>
          </Box>
        )}

        {!loading && chartData && (
          <Grid container spacing={3} sx={{ pt: 1 }}>
            {/* Grafico barre — spesa mensile con media */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Spesa mensile da Gen a {MONTHS[selectedMonth - 1]} {chartData.currentYear} · confronto con {chartData.prevYear}
              </Typography>
              <BarAvgChart
                currentYear={chartData.currentYear}
                prevYear={chartData.prevYear}
                currentData={currentData}
                prevData={prevData}
                selectedMonth={selectedMonth}
              />
            </Grid>

            <Grid size={12}>
              <Divider />
            </Grid>

            {/* Grafico linea — andamento cumulativo */}
            <Grid size={12}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Andamento cumulativo da Gen a {MONTHS[selectedMonth - 1]} {chartData.currentYear} · confronto con {chartData.prevYear}
              </Typography>
              <LineChart
                currentYear={chartData.currentYear}
                prevYear={chartData.prevYear}
                currentData={currentData}
                prevData={prevData}
                selectedMonth={selectedMonth}
              />
            </Grid>
          </Grid>
        )}

        {!loading && !chartData && (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.disabled">Nessun dato disponibile</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}

SubjectChartQuickView.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
