'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'src/routes/hooks';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

import { useGetCashFlowDetails, updateCashFlow } from 'src/api/cash-flow';
import { CashFlowEditModal } from '../cash-flow-edit-modal';

export function CashFlowEditView() {
  const params = useParams();
  const router = useRouter();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const { cashFlowItem } = useGetCashFlowDetails(params.id);

  const handleSave = useCallback(async (id, data) => {
    try {
      await updateCashFlow(id, data);
      enqueueSnackbar('Prelievo aggiornato', { variant: 'success' });
      router.push(paths.dashboard.cash_flow.root);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'aggiornamento', { variant: 'error' });
    }
  }, [enqueueSnackbar, router]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Modifica Prelievo"
        links={[
          { name: 'Report', href: paths.dashboard.root },
          { name: 'Gestione Contante', href: paths.dashboard.cash_flow.root },
          { name: 'Modifica' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {cashFlowItem && (
          <CashFlowEditModal
            open
            onClose={() => router.push(paths.dashboard.cash_flow.root)}
            onSave={handleSave}
            item={cashFlowItem}
          />
        )}
      </Box>
    </Container>
  );
}
