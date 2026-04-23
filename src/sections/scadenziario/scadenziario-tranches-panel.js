'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { createTranche, updatePaymentStatus, useGetInvoiceChildren } from 'src/api/scadenziario-api';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  completed: 'success',
  overdue:   'error',
  upcoming:  'warning',
  future:    'info',
  partial:   'warning',
};

const STATUS_LABEL = {
  completed: 'Pagato',
  overdue:   'Scaduto',
  upcoming:  'In scadenza',
  future:    'Da pagare',
  partial:   'Parz. pagato',
};

// ----------------------------------------------------------------------

export default function ScadenziarioTranchesPanel({ parentId, parentAmount, ownerId, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();
  const { children, childrenLoading, childrenMutate } = useGetInvoiceChildren(parentId);

  const [addOpen, setAddOpen] = useState(false);
  const [newDate, setNewDate]     = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote]     = useState('');
  const [saving, setSaving]       = useState(false);

  const scheduled = children.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  const paid      = children.filter(c => c.status === 'completed').reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  const residual  = parseFloat(parentAmount || 0) - scheduled;
  const progress  = parentAmount > 0 ? (paid / parseFloat(parentAmount)) * 100 : 0;

  const handleMarkPaid = async (child) => {
    try {
      await updatePaymentStatus(child.id, new Date().toISOString().substring(0, 10), 'completed');
      childrenMutate();
      onUpdated?.();
      enqueueSnackbar('Tranche segnata come pagata', { variant: 'success' });
    } catch {
      enqueueSnackbar('Errore aggiornamento', { variant: 'error' });
    }
  };

  const handleAddTranche = async () => {
    if (!newDate || !newAmount) return;
    setSaving(true);
    try {
      await createTranche({
        parent_id: parentId,
        date:      format(newDate, 'yyyy-MM-dd'),
        amount:    parseFloat(newAmount),
        description: newNote || null,
        owner_id:  ownerId,
        type:      'acconto',
        status:    'future',
      });
      setNewDate(null);
      setNewAmount('');
      setNewNote('');
      setAddOpen(false);
      childrenMutate();
      onUpdated?.();
      enqueueSnackbar('Tranche aggiunta', { variant: 'success' });
    } catch {
      enqueueSnackbar('Errore creazione tranche', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <Stack spacing={0.5} mb={2}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Pagato: {paid.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
            {' / '}
            {parseFloat(parentAmount || 0).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
          <Typography variant="caption" color={residual > 0 ? 'warning.main' : 'success.main'}>
            Residuo programmato: {residual.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={Math.min(progress, 100)} color={progress >= 100 ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3 }} />
      </Stack>

      {childrenLoading && <Typography variant="caption">Caricamento tranches…</Typography>}

      {children.length > 0 && (
        <Table size="small" sx={{ mb: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell align="right">Importo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map((child) => (
              <TableRow key={child.id} hover>
                <TableCell>
                  <Typography variant="body2">
                    {child.date ? format(new Date(child.date), 'dd MMM yyyy', { locale: it }) : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {child.description || child.subject || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2" fontWeight="bold">
                    {parseFloat(child.amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Label variant="soft" color={STATUS_COLOR[child.status] || 'default'}>
                    {STATUS_LABEL[child.status] || child.status}
                  </Label>
                </TableCell>
                <TableCell align="right">
                  {child.status !== 'completed' && (
                    <IconButton size="small" color="success" onClick={() => handleMarkPaid(child)} title="Segna come pagato">
                      <Iconify icon="eva:checkmark-circle-2-fill" width={18} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Button
        size="small"
        startIcon={<Iconify icon="eva:plus-fill" />}
        onClick={() => setAddOpen((v) => !v)}
        sx={{ mb: 1 }}
      >
        Aggiungi tranche
      </Button>

      <Collapse in={addOpen}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ mt: 1 }}>
          <DatePicker
            label="Data"
            value={newDate}
            onChange={setNewDate}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
          />
          <TextField
            label="Importo €"
            size="small"
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            sx={{ maxWidth: 130 }}
          />
          <TextField
            label="Nota (opz.)"
            size="small"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            size="small"
            disabled={!newDate || !newAmount || saving}
            onClick={handleAddTranche}
          >
            {saving ? 'Salvo…' : 'Aggiungi'}
          </Button>
        </Stack>
      </Collapse>
    </Box>
  );
}
