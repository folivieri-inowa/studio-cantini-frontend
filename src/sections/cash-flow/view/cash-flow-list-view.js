'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

import {
  useGetCashFlow,
  createCashFlow,
  updateCashFlow,
  deleteCashFlow,
  updateCashFlowStatus,
  createExpense,
  updateExpense,
  deleteExpense,
  uploadExpenseAttachment,
  deleteExpenseAttachment,
} from 'src/api/cash-flow';

import { CashFlowKpiCards } from '../cash-flow-kpi-cards';
import { CashFlowTable } from '../cash-flow-table';
import { CashFlowCreateModal } from '../cash-flow-create-modal';
import { CashFlowDetailsModal } from '../cash-flow-details-modal';
import { CashFlowEditModal } from '../cash-flow-edit-modal';

// ----------------------------------------------------------------------

export function CashFlowListView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const { cashFlow, cashFlowLoading, cashFlowMutate } = useGetCashFlow();

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // --- Navigation ---
  const handleView = useCallback(async (id) => {
    try {
      const { default: axios } = await import('src/utils/axios');
      const res = await axios.post('/api/cash-flow/details', { id });
      setSelectedItem(res.data?.data || null);
      setOpenDetails(true);
    } catch (err) {
      enqueueSnackbar('Errore nel caricamento dei dettagli', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // --- Create ---
  const handleCreate = useCallback(async (data) => {
    try {
      await createCashFlow(data);
      enqueueSnackbar('Prelievo creato con successo', { variant: 'success' });
      cashFlowMutate();
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nella creazione', { variant: 'error' });
    }
  }, [enqueueSnackbar, cashFlowMutate]);

  // --- Edit ---
  const handleEdit = useCallback(async (id, data) => {
    try {
      await updateCashFlow(id, data);
      enqueueSnackbar('Prelievo aggiornato', { variant: 'success' });
      cashFlowMutate();
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'aggiornamento', { variant: 'error' });
    }
  }, [enqueueSnackbar, cashFlowMutate]);

  // --- Delete ---
  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Eliminare questo prelievo? Verranno rimosse anche tutte le spese collegate.')) return;
    try {
      await deleteCashFlow(id);
      enqueueSnackbar('Prelievo eliminato', { variant: 'success' });
      cashFlowMutate();
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'eliminazione', { variant: 'error' });
    }
  }, [enqueueSnackbar, cashFlowMutate]);

  // --- Status ---
  const handleUpdateStatus = useCallback(async (id, status) => {
    try {
      await updateCashFlowStatus(id, status);
      enqueueSnackbar('Stato aggiornato', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'aggiornamento stato', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // --- Expense CRUD ---
  const handleExpenseCreate = useCallback(async (data) => {
    try {
      await createExpense(data);
      enqueueSnackbar('Spesa aggiunta', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'aggiunta spesa', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleExpenseUpdate = useCallback(async (id, data) => {
    try {
      await updateExpense(id, data);
      enqueueSnackbar('Spesa aggiornata', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'aggiornamento spesa', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleExpenseDelete = useCallback(async (id) => {
    try {
      await deleteExpense(id);
      enqueueSnackbar('Spesa eliminata', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'eliminazione spesa', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // --- Attachment ---
  const handleAttachmentUpload = useCallback(async (formData) => {
    try {
      await uploadExpenseAttachment(formData);
      enqueueSnackbar('Allegato caricato', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nel caricamento', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleAttachmentDelete = useCallback(async (id) => {
    try {
      await deleteExpenseAttachment(id);
      enqueueSnackbar('Allegato eliminato', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Errore nell\'eliminazione allegato', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  // --- Refresh details after mutation ---
  const handleRefreshDetails = useCallback(async () => {
    if (selectedItem?.id) {
      try {
        const { default: axios } = await import('src/utils/axios');
        const res = await axios.post('/api/cash-flow/details', { id: selectedItem.id });
        setSelectedItem(res.data?.data || null);
      } catch {
        // silent
      }
    }
    cashFlowMutate();
  }, [selectedItem?.id, cashFlowMutate]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Gestione Contante"
        links={[
          { name: 'Report', href: paths.dashboard.root },
          { name: 'Gestione Contante' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => setOpenCreate(true)}
          >
            Nuovo Prelievo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CashFlowKpiCards cashFlow={cashFlow} />

      <Box sx={{ mt: 3 }}>
        <CashFlowTable
          cashFlow={cashFlow}
          loading={cashFlowLoading}
          onView={handleView}
          onEdit={(id) => { setSelectedItem(cashFlow.find(cf => cf.id === id)); setOpenEdit(true); }}
          onDelete={handleDelete}
        />
      </Box>

      {/* Modals */}
      <CashFlowCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSave={handleCreate}
      />

      {selectedItem && (
        <>
          <CashFlowDetailsModal
            open={openDetails}
            onClose={() => { setOpenDetails(false); setSelectedItem(null); }}
            item={selectedItem}
            onUpdateStatus={handleUpdateStatus}
            onExpenseCreate={handleExpenseCreate}
            onExpenseUpdate={handleExpenseUpdate}
            onExpenseDelete={handleExpenseDelete}
            onAttachmentUpload={handleAttachmentUpload}
            onAttachmentDelete={handleAttachmentDelete}
            onRefresh={handleRefreshDetails}
          />
          <CashFlowEditModal
            open={openEdit}
            onClose={() => { setOpenEdit(false); setSelectedItem(null); }}
            onSave={handleEdit}
            item={selectedItem}
          />
        </>
      )}
    </Container>
  );
}
