'use client';

import { useCallback } from 'react';
import { useRouter } from 'src/routes/hooks';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

import { createCashFlow } from 'src/api/cash-flow';
import { CashFlowCreateModal } from '../cash-flow-create-modal';

export function CashFlowCreateView() {
  const router = useRouter();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const handleSave = useCallback(async (data) => {
    try {
      await createCashFlow(data);
      enqueueSnackbar('Prelievo creato con successo', { variant: 'success' });
      router.push(paths.dashboard.cash_flow.root);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nella creazione', { variant: 'error' });
    }
  }, [enqueueSnackbar, router]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuovo Prelievo"
        links={[
          { name: 'Report', href: paths.dashboard.root },
          { name: 'Gestione Contante', href: paths.dashboard.cash_flow.root },
          { name: 'Nuovo Prelievo' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Inserisci i dati del prelievo
        </Typography>
        <CashFlowCreateModal
          open
          onClose={() => router.push(paths.dashboard.cash_flow.root)}
          onSave={handleSave}
        />
      </Box>
    </Container>
  );
}
