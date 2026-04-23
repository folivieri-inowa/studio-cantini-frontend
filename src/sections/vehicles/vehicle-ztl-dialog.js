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

import { createVehicleZtl, updateVehicleZtl } from 'src/api/vehicles';
import { useSnackbar } from 'src/components/snackbar';

const PERMIT_TYPES = ['residente', 'posto_auto', 'altro'];
const EMPTY = { city: '', authorization_number: '', permit_type: 'residente', valid_until: '', notes: '' };

export default function VehicleZtlDialog({ open, onClose, vehicleId, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setForm(editItem ? { ...EMPTY, ...editItem } : EMPTY); }, [editItem, open]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = { ...form, vehicle_id: vehicleId };
      if (editItem) await updateVehicleZtl(editItem.id, payload);
      else await createVehicleZtl(payload);
      enqueueSnackbar(editItem ? 'ZTL aggiornata' : 'ZTL creata', { variant: 'success' });
      onSuccess();
      onClose();
    } catch { enqueueSnackbar('Errore durante il salvataggio', { variant: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editItem ? 'Modifica ZTL' : 'Nuova ZTL'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="Città" value={form.city} onChange={set('city')} fullWidth />
            <TextField label="N° Autorizzazione" value={form.authorization_number} onChange={set('authorization_number')} fullWidth />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField select label="Tipologia" value={form.permit_type} onChange={set('permit_type')} fullWidth>
              {PERMIT_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Scadenza" type="date" value={form.valid_until} onChange={set('valid_until')} fullWidth InputLabelProps={{ shrink: true }} />
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
