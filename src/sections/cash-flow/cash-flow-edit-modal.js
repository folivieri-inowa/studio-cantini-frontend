'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import axios from 'src/utils/axios';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

export function CashFlowEditModal({ open, onClose, onSave, item }) {
  const { db } = useSettingsContext();
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState({
    owner_id: '',
    withdrawal_date: '',
    amount: '',
    employee_name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      axios.get('/api/owner/list', { params: { db } }).then((res) => {
        setOwners(res.data?.data || []);
      }).catch(() => {});
      setForm({
        owner_id: item.owner_id || '',
        withdrawal_date: item.withdrawal_date || '',
        amount: item.amount?.toString() || '',
        employee_name: item.employee_name || '',
        description: item.description || '',
      });
    }
  }, [open, item]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.withdrawal_date) return;
    setSaving(true);
    try {
      const payload = {
        withdrawal_date: form.withdrawal_date,
        employee_name: form.employee_name || undefined,
        description: form.description || undefined,
      };
      // Se aperto, permetti modifica campi sensibili
      if (item?.status === 'open') {
        payload.owner_id = form.owner_id || undefined;
        payload.amount = form.amount ? parseFloat(form.amount) : undefined;
      }
      await onSave(item.id, payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  // Show minimal form if closed
  const isClosed = item?.status === 'closed';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isClosed ? 'Dettaglio Prelievo (chiuso)' : 'Modifica Prelievo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {isClosed ? (
            <>
              <TextField label="Conto" value={item?.owner_name || ''} InputProps={{ readOnly: true }} />
              <TextField label="Data Prelievo" value={item?.withdrawal_date || ''} InputProps={{ readOnly: true }} />
              <TextField label="Importo" value={`€ ${parseFloat(item?.amount || 0).toFixed(2).replace('.', ',')}`} InputProps={{ readOnly: true }} />
              <TextField label="Dipendente" value={item?.employee_name || ''} InputProps={{ readOnly: true }} />
              <TextField
                label="Descrizione"
                value={form.description}
                onChange={handleChange('description')}
                multiline rows={2}
              />
            </>
          ) : (
            <>
              <TextField select label="Conto Corrente" value={form.owner_id} onChange={handleChange('owner_id')}>
                {owners.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
              <TextField label="Data Prelievo" type="date" value={form.withdrawal_date} onChange={handleChange('withdrawal_date')} InputLabelProps={{ shrink: true }} />
              <TextField label="Importo (€)" type="number" value={form.amount} onChange={handleChange('amount')} inputProps={{ min: 0, step: 0.01 }} />
              <TextField label="Nome Dipendente" value={form.employee_name} onChange={handleChange('employee_name')} />
              <TextField label="Descrizione" value={form.description} onChange={handleChange('description')} multiline rows={2} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annulla</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
