'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Card,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function AnalyticsView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/classification/analytics?db=${settings.db}&days=${days}`
      );
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        enqueueSnackbar(data.error || 'Errore caricamento analytics', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [settings.db, days, enqueueSnackbar]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Card sx={{ p: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Card>
      </Container>
    );
  }

  if (!analytics) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        <Typography variant="h6">Nessun dato disponibile</Typography>
      </Container>
    );
  }

  const {
    overall,
    method_distribution,
    confidence_trend,
    confidence_ranges,
    top_categories,
    top_subjects,
    rules,
  } = analytics;

  // Prepare data for pie chart (method distribution)
  const methodPieData = method_distribution.map((item, index) => ({
    id: index,
    value: item.count,
    label: item.method || 'unknown',
  }));

  // Prepare data for confidence trend line chart
  const confidenceTrendData = confidence_trend.map((item) => ({
    date: new Date(item.week).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
    confidence: item.avg_confidence,
    accuracy: item.accuracy * 100,
  }));

  // Prepare data for confidence ranges bar chart
  const confidenceRangesData = confidence_ranges.map((item) => ({
    range: item.range,
    count: item.count,
    accuracy: item.accuracy * 100,
  }));

  // Prepare data for top categories bar chart
  const topCategoriesData = top_categories.map((item) => ({
    name: item.name.length > 20 ? `${item.name.substring(0, 20)}...` : item.name,
    count: item.count,
  }));

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" gutterBottom>
              Analytics Classificazione AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Panoramica delle performance del sistema di classificazione automatica
            </Typography>
          </Box>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              value={days}
              label="Periodo"
              onChange={(e) => setDays(e.target.value)}
            >
              <MenuItem value={7}>Ultimi 7 giorni</MenuItem>
              <MenuItem value={30}>Ultimi 30 giorni</MenuItem>
              <MenuItem value={90}>Ultimi 90 giorni</MenuItem>
              <MenuItem value={180}>Ultimi 6 mesi</MenuItem>
              <MenuItem value={365}>Ultimo anno</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Classificazioni Totali
              </Typography>
              <Typography variant="h3">{overall.total_classifications || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {overall.avg_per_day || 0} al giorno
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Accuracy Media
              </Typography>
              <Typography variant="h3" color="success.main">
                {Math.round((overall.overall_accuracy || 0) * 100)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Classificazioni corrette
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Confidence Media
              </Typography>
              <Typography variant="h3" color="primary.main">
                {overall.avg_confidence || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Range: {overall.min_confidence || 0}% - {overall.max_confidence || 0}%
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Regole Attive
              </Typography>
              <Typography variant="h3">{rules.active_rules || 0}</Typography>
              <Typography variant="caption" color="text.secondary">
                {rules.total_rules || 0} totali ({rules.disabled_rules || 0} disabilitate)
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row 1 */}
        <Grid container spacing={3}>
          {/* Method Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribuzione per Metodo
              </Typography>
              {methodPieData.length > 0 ? (
                <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                  <PieChart
                    series={[
                      {
                        data: methodPieData,
                        highlightScope: { faded: 'global', highlighted: 'item' },
                        faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                      },
                    ]}
                    width={400}
                    height={300}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
              <Stack spacing={1} sx={{ mt: 2 }}>
                {method_distribution.map((item, index) => (
                  <Box key={index}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">
                        {item.method}: {item.count} classificazioni
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Accuracy: {Math.round(item.accuracy * 100)}%
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>

          {/* Confidence Ranges Bar Chart */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Distribuzione Confidence
              </Typography>
              {confidenceRangesData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <BarChart
                    dataset={confidenceRangesData}
                    xAxis={[{ scaleType: 'band', dataKey: 'range' }]}
                    series={[
                      { dataKey: 'count', label: 'Classificazioni', color: '#1976d2' },
                    ]}
                    width={500}
                    height={300}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row 2 */}
        <Grid container spacing={3}>
          {/* Confidence Trend Line Chart */}
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Trend Confidence e Accuracy nel Tempo
              </Typography>
              {confidenceTrendData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <LineChart
                    dataset={confidenceTrendData}
                    xAxis={[{ scaleType: 'point', dataKey: 'date' }]}
                    series={[
                      { dataKey: 'confidence', label: 'Confidence Media (%)', color: '#1976d2' },
                      { dataKey: 'accuracy', label: 'Accuracy (%)', color: '#2e7d32' },
                    ]}
                    width={1000}
                    height={300}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row 3 */}
        <Grid container spacing={3}>
          {/* Top Categories */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top 10 Categorie
              </Typography>
              {topCategoriesData.length > 0 ? (
                <Box sx={{ height: 400 }}>
                  <BarChart
                    dataset={topCategoriesData}
                    series={[
                      { dataKey: 'count', label: 'Classificazioni', color: '#ed6c02' },
                    ]}
                    width={500}
                    height={400}
                    layout="horizontal"
                    yAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                  />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              )}
            </Card>
          </Grid>

          {/* Top Subjects */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Top 10 Soggetti
              </Typography>
              <Stack spacing={1.5} sx={{ maxHeight: 400, overflow: 'auto' }}>
                {top_subjects.map((item, index) => (
                  <Box key={index} sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.category}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6">{item.count}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Conf: {item.avg_confidence}%
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
