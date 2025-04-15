import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axios from '../../../utils/axios';
import ChartColumnStacked from '../../_examples/extra/chart-view/chart-column-stacked';

// ----------------------------------------------------------------------

const monthCategories = [
  'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
  'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
];

export default function DetailsChartQuickView({ data, open, onClose }) {
  const [chartData, setChartData] = useState({ series: [], subject: '', category: '', year: '' });

  useEffect(() => {
    const fetchChartData = async () => {
      if (!data || !open) return;

      try {
        const response = await axios.post('/api/report/category/subject/details/chart', data);
        setChartData(response.data.data); // Note the .data.data here
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, [data, open]);

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h5" gutterBottom>
          Dettaglio distribuzione spese {chartData.subjectName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ py: 3 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography>
                Distribuzione spese per mese per l&#39;anno {chartData.currentYear}
              </Typography>
              <ChartColumnStacked
                series={chartData.currentYearSeries || []}
                categories={monthCategories}
                title={`Spese ${chartData.currentYear}`}
              />
            </Grid>
            <Grid size={12}>
              <Typography>
                Distribuzione spese per mese per l&#39;anno {chartData.prevYear}
              </Typography>
              <ChartColumnStacked
                series={chartData.prevYearSeries || []}
                categories={monthCategories}
                title={`Spese ${chartData.prevYear}`}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DetailsChartQuickView.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
