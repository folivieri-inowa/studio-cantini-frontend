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
import Alert from '@mui/material/Alert';

import { createVehicleTax, updateVehicleTax, calculateVehicleBollo } from 'src/api/vehicles';
import { useSnackbar } from 'src/components/snackbar';

const REGIONS = ['Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia','Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna','Sicilia','Toscana','Trentino-Alto Adige','Umbria',"Valle d'Aosta",'Veneto'];
const STATUS_OPTIONS = ['da_pagare', 'pagato', 'esente'];
const PAYMENT_METHODS = ['Banca', 'Tabaccheria', 'ACI', 'Online', 'Altro'];

const EMPTY = { year: new Date().getFullYear(), region: '', kw_at_payment: '', bollo_amount: '', superbollo_amount: '', payment_reference: '', due_date: '', paid_date: '', payment_method: '', status: 'da_pagare', notes: '' };

export default function VehicleTaxDialog({ open, onClose, vehicleId, vehicleKw, editItem, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({ ...EMPTY, ...editItem, kw_at_payment: editItem.kw_at_payment ?? vehicleKw ?? '', bollo_amount: editItem.bollo_amount ?? '', superbollo_amount: editItem.superbollo_amount ?? '' });
    } else {
      setForm({ ...EMPTY, kw_at_payment: vehicleKw ?? '' });
    }
    setSuggestion(null);
  }, [editItem, open, vehicleKw]);

  const handleCalculate = async () => {
    if (!form.kw_at_payment) return;
    try {
      const result = await calculateVehicleBollo(Number(form.kw_at_payment), form.region || null);
      setSuggestion(result);
      setForm((p) => ({ ...p, bollo_amount: result.bollo, superbollo_amount: result.superbollo }));
    } catch { enqueueSnackbar('Errore nel calcolo', { variant: 'error' }); }
  };

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.year) { enqueueSnackbar('Anno obbligatorio', { variant: 'warning' }); return; }
    setLoading(true);
    try {
      const payload = { ...form, vehicle_id: vehicleId, year: Number(form.year), kw_at_payment: form.kw_at_payment ? Number(form.kw_at_payment) : null, bollo_amount: Number(form.bollo_amount) || 0, superbollo_amount: Number(form.superbollo_amount) || 0 };
      if (editItem) await updateVehicleTax(editItem.id, payload);
      else await createVehicleTax(payload);
      enqueueSnackbar(editItem ? 'Aggiornato' : 'Salvato', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore durante il salvataggio', { variant: 'error' });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editItem ? 'Modifica bollo' : 'Nuovo bollo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={2}>
            <TextField label="Anno *" type="number" value={form.year} onChange={set('year')} fullWidth />
            <TextField select label="Regione" value={form.region} onChange={set('region')} fullWidth>
              <MenuItem value="">—</MenuItem>
              {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="flex-end">
            <TextField label="kW veicolo" type="number" value={form.kw_at_payment} onChange={set('kw_at_payment')} fullWidth />
            <Button variant="outlined" onClick={handleCalculate} sx={{ whiteSpace: 'nowrap', mb: 0.1 }}>Calcola</Button>
          </Stack>
          {suggestion && (
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Importo calcolato: bollo <strong>€ {suggestion.bollo}</strong>{suggestion.superbollo > 0 && <> + superbollo <strong>€ {suggestion.superbollo}</strong></>}
            </Alert>
          )}
          <Stack direction="row" spacing={2}>
            <TextField label="Importo bollo (€)" type="number" value={form.bollo_amount} onChange={set('bollo_amount')} fullWidth />
            <TextField label="Superbollo (€)" type="number" value={form.superbollo_amount} onChange={set('superbollo_amount')} fullWidth />
          </Stack>
          <TextField label="N° versamento" value={form.payment_reference} onChange={set('payment_reference')} fullWidth />
          <Stack direction="row" spacing={2}>
            <TextField label="Scadenza" type="date" value={form.due_date} onChange={set('due_date')} fullWidth InputLabelProps={{ shrink: true }} />
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
