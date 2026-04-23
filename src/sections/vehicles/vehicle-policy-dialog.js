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
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import { createVehiclePolicy, updateVehiclePolicy } from 'src/api/vehicles';
import { useSnackbar } from 'src/components/snackbar';

const POLICY_TYPES = ['RCA', 'Kasko', 'Furto/Incendio', 'Cristalli', 'Infortuni', 'Assistenza stradale', 'Altro'];
const STATUS_OPTIONS = ['attiva', 'scaduta', 'disdetta'];

const EMPTY = { policy_number: '', insurer: '', policy_types: [], broker: '', start_date: '', end_date: '', premium_amount: '', status: 'attiva', notes: '' };

export default function VehiclePolicyDialog({ open, onClose, vehicleId, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(editItem ? { ...EMPTY, ...editItem, premium_amount: editItem.premium_amount ?? '' } : EMPTY);
  }, [editItem, open]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.policy_number || !form.insurer || !form.start_date || !form.end_date) {
      enqueueSnackbar('Compila i campi obbligatori', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, vehicle_id: vehicleId, premium_amount: form.premium_amount ? Number(form.premium_amount) : null };
      if (editItem) await updateVehiclePolicy(editItem.id, payload);
      else await createVehiclePolicy(payload);
      enqueueSnackbar(editItem ? 'Polizza aggiornata' : 'Polizza creata', { variant: 'success' });
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
      <DialogTitle>{editItem ? 'Modifica polizza' : 'Nuova polizza'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField label="Numero polizza *" value={form.policy_number} onChange={set('policy_number')} fullWidth />
          <TextField label="Compagnia assicurativa *" value={form.insurer} onChange={set('insurer')} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Coperture</InputLabel>
            <Select multiple value={form.policy_types} onChange={(e) => setForm((p) => ({ ...p, policy_types: e.target.value }))}
              input={<OutlinedInput label="Coperture" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => <Chip key={v} label={v} size="small" />)}
                </Box>
              )}>
              {POLICY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Broker/Agenzia" value={form.broker} onChange={set('broker')} fullWidth />
          <Stack direction="row" spacing={2}>
            <TextField label="Data inizio *" type="date" value={form.start_date} onChange={set('start_date')} fullWidth InputLabelProps={{ shrink: true }} />
            <TextField label="Data fine *" type="date" value={form.end_date} onChange={set('end_date')} fullWidth InputLabelProps={{ shrink: true }} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Premio annuale (€)" type="number" value={form.premium_amount} onChange={set('premium_amount')} fullWidth />
            <TextField select label="Stato" value={form.status} onChange={set('status')} fullWidth>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
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
