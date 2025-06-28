'use client';

import { useState, useEffect } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { PieChart } from '@mui/x-charts/PieChart';
import PropTypes from 'prop-types';

import { formatCurrency } from './scadenziario-utils';
import Iconify from '../../components/iconify';

// ----------------------------------------------------------------------

export default function ScadenziarioDashboard({ scadenze }) {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    upcomingAmount: 0,
    overdueAmount: 0,
    futureAmount: 0,
    countByStatus: {
      completed: 0,
      upcoming: 0,
      overdue: 0,
      future: 0
    }
  });

  // Colori per i diversi stati delle scadenze
  const chartColors = {
    completed: theme.palette.success.main, // Pagato
    upcoming: theme.palette.warning.main,  // In scadenza
    overdue: theme.palette.error.main,     // Scaduto
    future: theme.palette.info.main,       // Da pagare (futuro)
  };

  // Etichette per i diversi stati
  const statusLabels = {
    completed: 'Pagato',
    upcoming: 'In scadenza',
    overdue: 'Scaduto',
    future: 'Da pagare',
  };

  // Icone per i diversi stati
  const statusIcons = {
    completed: 'eva:checkmark-circle-fill',
    upcoming: 'eva:clock-fill',
    overdue: 'eva:alert-triangle-fill',
    future: 'eva:calendar-outline',
    total: 'eva:pie-chart-fill',
    toBePaid: 'eva:bell-fill',
  };

  useEffect(() => {
    if (!scadenze || !scadenze.length) return;

    const newStats = scadenze.reduce(
      (acc, item) => {
        // Controllo che l'item sia valido e abbia un importo numerico
        if (!item || typeof item.amount !== 'number') {
          return acc;
        }
        
        // Utilizza uno stato predefinito se non è definito
        const itemStatus = item.status || 'future';
        
        // Conteggio per stato
        acc.countByStatus[itemStatus] = (acc.countByStatus[itemStatus] || 0) + 1;
        
        // Calcolo importi totali
        acc.totalAmount += item.amount;

        // Calcolo importi per stato
        switch (itemStatus) {
          case 'completed':
            acc.paidAmount += item.amount;
            break;
          case 'upcoming':
            acc.upcomingAmount += item.amount;
            break;
          case 'overdue':
            acc.overdueAmount += item.amount;
            break;
          case 'future':
            acc.futureAmount += item.amount;
            break;
          default:
            break;
        }

        return acc;
      },
      {
        totalAmount: 0,
        paidAmount: 0,
        upcomingAmount: 0,
        overdueAmount: 0,
        futureAmount: 0,
        countByStatus: {
          completed: 0,
          upcoming: 0,
          overdue: 0,
          future: 0
        }
      }
    );

    setStats(newStats);
  }, [scadenze]);

  // Prepara i dati per il grafico a torta
  const chartData = Object.entries(stats.countByStatus).map(([status, count]) => ({
    id: status,
    value: count,
    label: statusLabels[status],
    color: chartColors[status],
  })).filter(item => item.value > 0);

  const StatusInfoBox = ({ title, amount, status, icon }) => (
    <Box sx={{ 
      p: 2, 
      borderRadius: 1, 
      bgcolor: alpha(chartColors[status] || theme.palette.primary.main, 0.08),
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon={icon} sx={{ color: chartColors[status] || theme.palette.primary.main, width: 24, height: 24 }} />
        <Typography variant="body2">{title}</Typography>
      </Stack>
      <Typography 
        variant={title.includes('Totale complessivo') || title.includes('Totale da pagare') ? 'h6' : 'subtitle1'} 
        fontWeight="bold" 
        sx={{ color: status === 'default' ? 'text.primary' : chartColors[status] }}
      >
        {formatCurrency(amount)}
      </Typography>
    </Box>
  );

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={6}>
        <Card sx={{ height: '100%', boxShadow: '0px 6px 18px -8px rgba(145, 158, 171, 0.16)' }}>
          <CardHeader title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:pie-chart-2-fill" sx={{ color: 'primary.main', width: 28, height: 28 }} />
              <Typography variant="h6">Riepilogo scadenziario</Typography>
            </Stack>
          } />
          <Box sx={{ p: 3, pb: 1 }} dir="ltr">
            <PieChart
              series={[
                {
                  data: chartData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 40, additionalRadius: -30, color: 'gray' },
                  valueFormatter: (value) => `${value} scadenze`,
                  innerRadius: 80,
                  paddingAngle: 2,
                  cornerRadius: 4,
                },
              ]}
              height={300}
              margin={{ right: 120 }}
              slotProps={{
                legend: {
                  direction: 'column',
                  position: { vertical: 'middle', horizontal: 'right' },
                  labelStyle: {
                    fontSize: 14,
                  },
                },
              }}
            />
          </Box>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: '100%', boxShadow: '0px 6px 18px -8px rgba(145, 158, 171, 0.16)' }}>
          <CardHeader title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:credit-card-fill" sx={{ color: 'success.main', width: 28, height: 28 }} />
              <Typography variant="h6">Totali per categoria</Typography>
            </Stack>
          } />
          <Stack spacing={2} sx={{ p: 3 }}>
            <StatusInfoBox 
              title="Totale pagato" 
              amount={stats.paidAmount} 
              status="completed" 
              icon={statusIcons.completed}
            />

            <StatusInfoBox 
              title="Da pagare (in scadenza)" 
              amount={stats.upcomingAmount} 
              status="upcoming" 
              icon={statusIcons.upcoming}
            />
            
            <StatusInfoBox 
              title="Scaduto" 
              amount={stats.overdueAmount} 
              status="overdue" 
              icon={statusIcons.overdue}
            />

            <StatusInfoBox 
              title="Da pagare (futuro)" 
              amount={stats.futureAmount} 
              status="future" 
              icon={statusIcons.future}
            />

            <Divider />

            <StatusInfoBox 
              title="Totale complessivo" 
              amount={stats.totalAmount} 
              status="default" 
              icon={statusIcons.total}
            />

            <StatusInfoBox 
              title="Totale da pagare" 
              amount={stats.upcomingAmount + stats.overdueAmount + stats.futureAmount} 
              status="overdue" 
              icon={statusIcons.toBePaid}
            />
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

ScadenziarioDashboard.propTypes = {
  scadenze: PropTypes.array,
};
