'use client';

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';
import { alpha, useTheme } from '@mui/material/styles';

import Iconify from '../../components/iconify';
import { formatCurrency } from './scadenziario-utils';

// ----------------------------------------------------------------------

export default function ScadenziarioDashboard({ scadenze = [] }) {
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
  
  // Verifica che il tema sia definito correttamente per evitare errori
  const safeTheme = theme || {};

  // Funzione di utilità per accedere in modo sicuro ai colori del tema
  const getThemeColor = (paletteType, shade) => {
    try {
      return safeTheme.palette?.[paletteType]?.[shade] || '#666666'; // Colore grigio come fallback sicuro
    } catch (error) {
      console.error(`Errore nell'accesso al colore del tema: ${paletteType}.${shade}`, error);
      return '#666666';
    }
  };

  // Colori per i diversi stati delle scadenze
  const chartColors = {
    completed: getThemeColor('success', 'main'), // Pagato
    upcoming: getThemeColor('warning', 'main'),  // In scadenza
    overdue: getThemeColor('error', 'main'),     // Scaduto
    future: getThemeColor('info', 'main'),       // Da pagare (futuro)
    default: getThemeColor('primary', 'main'),   // Stato predefinito
    total: getThemeColor('primary', 'main'),     // Totali
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
    default: 'eva:info-fill',  // Icona predefinita per stati non definiti
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
  const chartData = Object.entries(stats.countByStatus)
    .map(([status, count]) => {
      // Verifica che lo stato abbia un'etichetta e un colore definiti
      const statusLabel = statusLabels[status] || status;
      const statusColor = chartColors[status] || theme.palette.primary.main;
      
      return {
        id: status,
        value: count,
        label: statusLabel,
        color: statusColor,
      };
    })
    .filter(item => item.value > 0);

  const StatusInfoBox = ({ title, amount, status, icon }) => {
    // Funzione sicura per ottenere il colore appropriato
    const getStatusColor = () => {
      // Verifica che chartColors e lo status esistano prima di accedere
      if (chartColors && status && chartColors[status]) {
        return chartColors[status];
      }
      // Fallback sicuro a un colore predefinito
      return theme.palette.primary.main;
    };

    return (
      <Box sx={{ 
        p: 2, 
        borderRadius: 1, 
        bgcolor: alpha(getStatusColor(), 0.08),
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon={icon || 'eva:info-fill'} sx={{ color: getStatusColor(), width: 24, height: 24 }} />
          <Typography variant="body2">{title}</Typography>
        </Stack>
        <Typography 
          variant={title && (title.includes('Totale complessivo') || title.includes('Totale da pagare')) ? 'h6' : 'subtitle1'} 
          fontWeight="bold" 
          sx={{ color: status === 'default' ? 'text.primary' : getStatusColor() }}
        >
          {formatCurrency(amount)}
        </Typography>
      </Box>
    );
  };
  
  // Definizione PropTypes per il componente interno
  StatusInfoBox.propTypes = {
    title: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
  };

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={6}>
        <Card sx={{ height: '100%', boxShadow: '0px 6px 18px -8px rgba(145, 158, 171, 0.16)' }}>
          <CardHeader title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify 
                icon="eva:pie-chart-2-fill" 
                sx={{ color: getThemeColor('primary', 'main'), width: 28, height: 28 }} 
              />
              <Typography variant="h6">Riepilogo scadenziario</Typography>
            </Stack>
          } />
          <Box sx={{ p: 3, pb: 1 }} dir="ltr">
            {chartData.length > 0 ? (
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
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
                <Typography variant="body1" color="text.secondary">
                  Nessun dato disponibile
                </Typography>
              </Box>
            )}
          </Box>
        </Card>
      </Grid>

      <Grid xs={12} md={6}>
        <Card sx={{ height: '100%', boxShadow: '0px 6px 18px -8px rgba(145, 158, 171, 0.16)' }}>
          <CardHeader title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify 
                icon="eva:credit-card-fill" 
                sx={{ color: getThemeColor('success', 'main'), width: 28, height: 28 }} 
              />
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
              status="total" 
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
