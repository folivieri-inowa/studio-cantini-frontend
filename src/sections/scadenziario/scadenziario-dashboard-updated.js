'use client';

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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

  const StatusCard = ({ title, amount, status, icon, count }) => {
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
      <Card sx={{ 
        height: 160, // Altezza fissa per tutte le card
        width: '100%', // Occupare l'intera larghezza disponibile
        boxSizing: 'border-box', // Importante per calcolare correttamente le dimensioni
        boxShadow: '0px 6px 18px -8px rgba(145, 158, 171, 0.16)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: alpha(getStatusColor(), 0.04),
        borderLeft: `4px solid ${getStatusColor()}`,
      }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Iconify 
            icon={icon || 'eva:info-fill'} 
            sx={{ color: getStatusColor(), width: 28, height: 28 }} 
          />
          <Typography variant="h6">{title}</Typography>
        </Stack>
        
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, color: getStatusColor() }}>
            {formatCurrency(amount)}
          </Typography>
          {count !== undefined && (
            <Typography variant="body2" color="text.secondary">
              {count} {count === 1 ? 'scadenza' : 'scadenze'}
            </Typography>
          )}
        </Box>
      </Card>
    );
  };
  
  // Definizione PropTypes per il componente interno
  StatusCard.propTypes = {
    title: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    count: PropTypes.number,
  };

  // Configurazione delle card da mostrare
  const cards = [
    {
      title: 'Totale pagato',
      amount: stats.paidAmount,
      status: 'completed',
      icon: statusIcons.completed,
      count: stats.countByStatus.completed,
    },
    {
      title: 'Da pagare (in scadenza)',
      amount: stats.upcomingAmount,
      status: 'upcoming',
      icon: statusIcons.upcoming,
      count: stats.countByStatus.upcoming,
    },
    {
      title: 'Scaduto',
      amount: stats.overdueAmount,
      status: 'overdue',
      icon: statusIcons.overdue,
      count: stats.countByStatus.overdue,
    },
    {
      title: 'Da pagare (futuro)',
      amount: stats.futureAmount,
      status: 'future',
      icon: statusIcons.future,
      count: stats.countByStatus.future,
    },
    {
      title: 'Totale da pagare',
      amount: stats.upcomingAmount + stats.overdueAmount + stats.futureAmount,
      status: 'overdue',
      icon: statusIcons.toBePaid,
    },
    {
      title: 'Totale complessivo',
      amount: stats.totalAmount,
      status: 'total',
      icon: statusIcons.total,
    },
  ];

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      {/* Prima riga - 3 card */}
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, width: '100%', mb: 3 }}>
        {cards.slice(0, 3).map((card, index) => (
          <Box 
            key={index} 
            sx={{ 
              width: { xs: '100%', md: 'calc(33.333% - 16px)' }, 
              mr: index < 2 ? { xs: 0, md: 3 } : 0,
              mb: { xs: 3, md: 0 }
            }}
          >
            <StatusCard
              title={card.title}
              amount={card.amount}
              status={card.status}
              icon={card.icon}
              count={card.count}
            />
          </Box>
        ))}
      </Box>
      
      {/* Seconda riga - 3 card */}
      <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, width: '100%' }}>
        {cards.slice(3, 6).map((card, index) => (
          <Box 
            key={index + 3} 
            sx={{ 
              width: { xs: '100%', md: 'calc(33.333% - 16px)' }, 
              mr: index < 2 ? { xs: 0, md: 3 } : 0,
              mb: { xs: 3, md: 0 }
            }}
          >
            <StatusCard
              title={card.title}
              amount={card.amount}
              status={card.status}
              icon={card.icon}
              count={card.count}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

ScadenziarioDashboard.propTypes = {
  scadenze: PropTypes.array,
};
