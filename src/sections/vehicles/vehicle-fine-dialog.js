'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

import { createVehicleFine, updateVehicleFine } from 'src/api/vehicles';
import { useSnackbar } from 'src/components/snackbar';

const AUTHORITIES = ['Polizia Municipale', 'Polizia Stradale', 'Carabinieri', 'Guardia di Finanza', 'Altro'];
const VIOLATION_TYPES = ['Eccesso di velocità', 'Divieto di sosta', 'Semaforo rosso', 'Uso del cellulare', 'Cintura di sicurezza', 'Sorpasso vietato', 'ZTL', 'Altro'];
const STATUS_OPTIONS = ['da_pagare', 'pagato', 'ricorsato', 'annullato'];
const PAYMENT_METHODS = ['Banca/Bollettino', 'Online', 'Tabaccheria', 'Ufficio postale', 'Altro'];

const EMPTY = {
  fine_date: '', violation_number: '', issuing_authority: '', violation_type: '',
  amount: '', discount_amount: '', due_date: '', paid_date: '',
  payment_method: '', status: 'da_pagare', appeal_notes: '', notes: '',
};

export default function VehicleFineDialog({ open, onClose, vehicleId, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { ...EMPTY, ...editItem, amount: editItem.amount ?? '', discount_amount: editItem.discount_amount ?? '' } : EMPTY);
  }, [editItem, open]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.fine_date) { enqueueSnackbar('Data obbligatoria', { variant: 'warning' }); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        vehicle_id: vehicleId,
        amount: Number(form.amount) || 0,
        discount_amount: form.discount_amount ? Number(form.discount_amount) : null,
      };
      if (editItem) await updateVehicleFine(editItem.id, payload);
      else await createVehicleFine(payload);
      enqueueSnackbar(editItem ? 'Contravvenzione aggiornata' : 'Contravvenzione registrata', { variant: 'success' });
      onSuccess();
      onClose();
    } catch {
      enqueueSnackbar('Errore durante il salvataggio', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editItem ? 'Modifica contravvenzione' : 'Nuova contravvenzione'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="Data verbale *" type="date" value={form.fine_date} onChange={set('fine_date')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="N° verbale" value={form.violation_number} onChange={set('violation_number')} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField select label="Ente" value={form.issuing_authority} onChange={set('issuing_authority')} fullWidth>
              <MenuItem value="">—</MenuItem>
              {AUTHORITIES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </TextField>
            <TextField select label="Infrazione" value={form.violation_type} onChange={set('violation_type')} fullWidth>
              <MenuItem value="">—</MenuItem>
              {VIOLATION_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Importo (€)" type="number" value={form.amount} onChange={set('amount')} fullWidth />
            <TextField label="Importo scontato (€)" type="number" value={form.discount_amount} onChange={set('discount_amount')} helperText="Pagamento entro 5 gg" fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Scadenza pagamento" type="date" value={form.due_date} onChange={set('due_date')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Data pagamento" type="date" value={form.paid_date} onChange={set('paid_date')} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField select label="Metodo pagamento" value={form.payment_method} onChange={set('payment_method')} fullWidth>
              <MenuItem value="">—</MenuItem>
              {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField select label="Stato" value={form.status} onChange={set('status')} fullWidth>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
          {form.status === 'ricorsato' && (
            <TextField label="Note ricorso" value={form.appeal_notes} onChange={set('appeal_notes')} fullWidth multiline rows={2} />
          )}
          <TextField label="Note" value={form.notes} onChange={set('notes')} fullWidth multiline rows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>Salva</Button>
      </DialogActions>
    </Dialog>
  );
}
