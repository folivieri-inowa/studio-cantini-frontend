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

import { createTranche, updatePaymentStatus, useGetInvoiceChildren, updateScadenziario } from 'src/api/scadenziario-api';

import ScadenziarioAttachmentUpload from './scadenziario-attachment-upload';

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
  const [receiptOpen, setReceiptOpen] = useState(null); // id tranche con receipt panel aperto

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

  const handleUploadReceipt = async (child, url) => {
    try {
      await updateScadenziario(child.id, {
        subject:      child.subject,
        description:  child.description || null,
        date:         child.date,
        amount:       child.amount,
        status:       child.status,
        payment_date: child.payment_date || null,
        type:         child.type || 'acconto',
        parent_id:    child.parent_id,
        owner_id:     child.owner_id,
        attachment_url: url,
      });
      childrenMutate();
      setReceiptOpen(null);
      enqueueSnackbar('Ricevuta caricata', { variant: 'success' });
    } catch {
      enqueueSnackbar('Errore salvataggio ricevuta', { variant: 'error' });
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
              <TableCell align="right">Azioni</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map((child) => (
              <>
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
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Label variant="soft" color={STATUS_COLOR[child.status] || 'default'}>
                        {STATUS_LABEL[child.status] || child.status}
                      </Label>
                      {child.attachment_url && (
                        <Iconify icon="eva:file-text-fill" width={14} sx={{ color: 'success.main' }} title="Ricevuta allegata" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                      <IconButton
                        size="small"
                        color={child.attachment_url ? 'success' : 'default'}
                        onClick={() => setReceiptOpen(receiptOpen === child.id ? null : child.id)}
                        title={child.attachment_url ? 'Visualizza/sostituisci ricevuta' : 'Allega ricevuta'}
                      >
                        <Iconify icon="eva:attach-2-fill" width={18} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
                {receiptOpen === child.id && (
                  <TableRow key={`${child.id}-receipt`}>
                    <TableCell colSpan={5} sx={{ pb: 2, pt: 0 }}>
                      <Box sx={{ pt: 1 }}>
                        {child.attachment_url ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Iconify icon="eva:file-text-fill" sx={{ color: 'success.main' }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>Ricevuta allegata</Typography>
                            <Button size="small" variant="outlined" href={child.attachment_url} target="_blank" startIcon={<Iconify icon="eva:external-link-fill" />}>
                              Apri
                            </Button>
                            <Button size="small" color="warning" onClick={() => setReceiptOpen(child.id + '-replace')}>
                              Sostituisci
                            </Button>
                          </Stack>
                        ) : null}
                        {(!child.attachment_url || receiptOpen === child.id + '-replace') && (
                          <ScadenziarioAttachmentUpload
                            ownerId={ownerId}
                            value={null}
                            onChange={(url) => {
                              if (url) handleUploadReceipt(child, url);
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </>
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
