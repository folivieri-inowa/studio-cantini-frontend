'use client';

import { useCallback } from 'react';
import { useParams, useRouter } from 'src/routes/hooks';
import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

import { useGetCashFlowDetails, updateCashFlowStatus, createExpense, updateExpense, deleteExpense, uploadExpenseAttachment, deleteExpenseAttachment } from 'src/api/cash-flow';
import { CashFlowDetailsModal } from '../cash-flow-details-modal';

export function CashFlowDetailsView() {
  const params = useParams();
  const router = useRouter();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const { cashFlowItem, cashFlowItemMutate } = useGetCashFlowDetails(params.id);

  const handleUpdateStatus = useCallback(async (id, status) => {
    await updateCashFlowStatus(id, status);
    enqueueSnackbar('Stato aggiornato', { variant: 'success' });
    cashFlowItemMutate();
  }, [enqueueSnackbar, cashFlowItemMutate]);

  const handleExpenseCreate = useCallback(async (data) => {
    await createExpense(data);
    enqueueSnackbar('Spesa aggiunta', { variant: 'success' });
  }, [enqueueSnackbar]);

  const handleExpenseUpdate = useCallback(async (id, data) => {
    await updateExpense(id, data);
    enqueueSnackbar('Spesa aggiornata', { variant: 'success' });
  }, [enqueueSnackbar]);

  const handleExpenseDelete = useCallback(async (id) => {
    await deleteExpense(id);
    enqueueSnackbar('Spesa eliminata', { variant: 'success' });
  }, [enqueueSnackbar]);

  const handleAttachmentUpload = useCallback(async (formData) => {
    await uploadExpenseAttachment(formData);
    enqueueSnackbar('Allegato caricato', { variant: 'success' });
  }, [enqueueSnackbar]);

  const handleAttachmentDelete = useCallback(async (id) => {
    await deleteExpenseAttachment(id);
    enqueueSnackbar('Allegato eliminato', { variant: 'success' });
  }, [enqueueSnackbar]);

  const handleClose = () => {
    router.push(paths.dashboard.cash_flow.root);
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Dettaglio Prelievo"
        links={[
          { name: 'Report', href: paths.dashboard.root },
          { name: 'Gestione Prelievi', href: paths.dashboard.cash_flow.root },
          { name: 'Dettaglio' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {cashFlowItem && (
        <CashFlowDetailsModal
          open
          onClose={handleClose}
          item={cashFlowItem}
          onUpdateStatus={handleUpdateStatus}
          onExpenseCreate={handleExpenseCreate}
          onExpenseUpdate={handleExpenseUpdate}
          onExpenseDelete={handleExpenseDelete}
          onAttachmentUpload={handleAttachmentUpload}
          onAttachmentDelete={handleAttachmentDelete}
          onRefresh={cashFlowItemMutate}
        />
      )}
    </Container>
  );
}
