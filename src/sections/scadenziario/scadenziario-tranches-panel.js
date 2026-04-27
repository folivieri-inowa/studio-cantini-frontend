'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
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

function AmountSummaryCard({ total, paid, remaining }) {
  const progress = total > 0 ? (paid / total) * 100 : 0;
  const isFullyPaid = remaining <= 0;

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.neutral' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={1.5}>
        <Stack flex={1} spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Totale fattura
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
        </Stack>

        <Stack flex={1} spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Pagato
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            {paid.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
        </Stack>

        <Stack flex={1} spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Da pagare
          </Typography>
          <Typography variant="h6" fontWeight="bold" color={isFullyPaid ? 'success.main' : 'warning.main'}>
            {remaining.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
        </Stack>
      </Stack>

      <Stack spacing={0.5}>
        <LinearProgress
          variant="determinate"
          value={Math.min(progress, 100)}
          color={isFullyPaid ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {Math.round(progress)}% pagato
          </Typography>
          {isFullyPaid && (
            <Chip
              label="Saldato"
              size="small"
              color="success"
              icon={<Iconify icon="eva:checkmark-circle-2-fill" width={14} />}
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export default function ScadenziarioTranchesPanel({ parentId, parentAmount, ownerId, onUpdated }) {
  const { enqueueSnackbar } = useSnackbar();
  const { children, childrenLoading, childrenMutate } = useGetInvoiceChildren(parentId);

  const [addOpen, setAddOpen] = useState(false);
  const [newDate, setNewDate]     = useState(null);
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote]     = useState('');
  const [saving, setSaving]       = useState(false);

  const total     = parseFloat(parentAmount || 0);
  const paid      = children.filter(c => c.status === 'completed').reduce((acc, c) => acc + parseFloat(c.amount || 0), 0);
  const remaining = total - paid;

  const handleMarkPaid = async (child) => {
    try {
      await updatePaymentStatus(child.id, new Date().toISOString().substring(0, 10), 'completed');
      childrenMutate();
      onUpdated?.();
      enqueueSnackbar('Acconto segnato come pagato', { variant: 'success' });
    } catch {
      enqueueSnackbar('Errore aggiornamento', { variant: 'error' });
    }
  };

  const handleAddTranche = async () => {
    if (!newDate || !newAmount) return;
    setSaving(true);
    try {
      await createTranche({
        parent_id:   parentId,
        date:        format(newDate, 'yyyy-MM-dd'),
        amount:      parseFloat(newAmount),
        description: newNote || null,
        owner_id:    ownerId,
        type:        'acconto',
        status:      'future',
      });
      setNewDate(null);
      setNewAmount('');
      setNewNote('');
      setAddOpen(false);
      childrenMutate();
      onUpdated?.();
      enqueueSnackbar('Acconto aggiunto', { variant: 'success' });
    } catch {
      enqueueSnackbar('Errore creazione acconto', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: 2, pb: 2 }}>
      <AmountSummaryCard total={total} paid={paid} remaining={remaining} />

      {childrenLoading && (
        <Typography variant="caption" color="text.secondary">Caricamento acconti…</Typography>
      )}

      {children.length > 0 && (
        <Table size="small" sx={{ mb: 1.5 }}>
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
                    <IconButton
                      size="small"
                      color="success"
                      onClick={() => handleMarkPaid(child)}
                      title="Segna come pagato"
                    >
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
        Aggiungi acconto
      </Button>

      <Collapse in={addOpen}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start" sx={{ mt: 1 }}>
          <DatePicker
            label="Data bonifico"
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
