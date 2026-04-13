'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { startOfMonth, endOfMonth } from 'date-fns';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const KPI_CONFIG = [
  {
    key: 'unpaid',
    label: 'Da pagare',
    color: 'info',
    icon: 'eva:bell-fill',
    filter: (s) => s.status !== 'completed',
  },
  {
    key: 'overdue',
    label: 'Scaduto',
    color: 'error',
    icon: 'eva:alert-triangle-fill',
    filter: (s) => s.status === 'overdue',
  },
  {
    key: 'upcoming',
    label: 'In scadenza',
    color: 'warning',
    icon: 'eva:clock-fill',
    filter: (s) => s.status === 'upcoming',
  },
  {
    key: 'paidMonth',
    label: 'Pagato (mese)',
    color: 'success',
    icon: 'eva:checkmark-circle-fill',
    filter: (s, monthStart, monthEnd) => {
      if (s.status !== 'completed' || !s.paymentDate) return false;
      const d = new Date(s.paymentDate);
      return d >= monthStart && d <= monthEnd;
    },
  },
];

// ----------------------------------------------------------------------

export default function ScadenziarioKpiCards({ scadenze = [] }) {
  const theme = useTheme();

  const kpi = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const sum = (arr) => arr.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    const fmt = (v) =>
      v.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

    return KPI_CONFIG.map((cfg) => {
      const filtered = scadenze.filter((s) => cfg.filter(s, monthStart, monthEnd));
      return {
        ...cfg,
        value: fmt(sum(filtered)),
        count: filtered.length,
      };
    });
  }, [scadenze]);

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
      gap={2}
      mb={3}
    >
      {kpi.map(({ key, label, value, count, color, icon }) => (
        <Card
          key={key}
          sx={{
            p: 2.5,
            boxShadow: (t) => t.customShadows?.z8,
            borderTop: `3px solid`,
            borderColor: `${color}.main`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (t) => alpha(t.palette[color].main, 0.12),
              }}
            >
              <Iconify icon={icon} sx={{ color: `${color}.main`, width: 22, height: 22 }} />
            </Box>

            <Typography
              variant="caption"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette[color].main, 0.08),
                color: `${color}.dark`,
                fontWeight: 'bold',
              }}
            >
              {count}
            </Typography>
          </Stack>

          <Typography variant="h5" sx={{ color: `${color}.main`, fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
            {label}
          </Typography>
        </Card>
      ))}
    </Box>
  );
}
