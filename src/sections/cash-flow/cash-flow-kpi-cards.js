'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CashFlowKpiCards({ cashFlow = [] }) {
  const totalWithdrawn = cashFlow.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalSpent = cashFlow.reduce((sum, item) => sum + parseFloat(item.total_spent || 0), 0);
  const totalRemaining = cashFlow.reduce((sum, item) => sum + parseFloat(item.remaining_balance || 0), 0);
  const openCount = cashFlow.filter((item) => item.status === 'open').length;

  const cards = [
    {
      label: 'Prelievi Totali',
      value: `€ ${totalWithdrawn.toFixed(2).replace('.', ',')}`,
      icon: 'solar:card-outline',
      color: 'primary.main',
    },
    {
      label: 'Spese Totali',
      value: `€ ${totalSpent.toFixed(2).replace('.', ',')}`,
      icon: 'solar:cart-check-outline',
      color: 'warning.main',
    },
    {
      label: 'Saldo Residuo',
      value: `€ ${totalRemaining.toFixed(2).replace('.', ',')}`,
      icon: 'solar:wallet-money-outline',
      color: 'success.main',
    },
    {
      label: 'Prelievi Aperti',
      value: `${openCount}`,
      icon: 'solar:clock-circle-outline',
      color: 'info.main',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid xs={12} sm={6} md={3} key={card.label}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: card.color,
                  color: 'common.white',
                }}
              >
                <Iconify icon={card.icon} width={24} />
              </Stack>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {card.label}
                </Typography>
                <Typography variant="h5">{card.value}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
