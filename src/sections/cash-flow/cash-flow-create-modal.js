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

export function CashFlowCreateModal({ open, onClose, onSave }) {
  const { db } = useSettingsContext();
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState({
    owner_id: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    amount: '',
    employee_name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && db) {
      axios.get('/api/owner/list', { params: { db } }).then((res) => {
        setOwners(res.data?.data || []);
      }).catch(() => {});
      setForm({
        owner_id: '',
        withdrawal_date: new Date().toISOString().split('T')[0],
        amount: '',
        employee_name: '',
        description: '',
      });
    }
  }, [open]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!form.owner_id || !form.withdrawal_date || !form.amount || !form.employee_name) return;
    setSaving(true);
    try {
      await onSave({
        owner_id: form.owner_id,
        withdrawal_date: form.withdrawal_date,
        amount: parseFloat(form.amount),
        employee_name: form.employee_name,
        description: form.description || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const valid = form.owner_id && form.withdrawal_date && form.amount && form.employee_name;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuovo Prelievo</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            select
            label="Conto Corrente"
            value={form.owner_id}
            onChange={handleChange('owner_id')}
            required
          >
            {owners.map((o) => (
              <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Data Prelievo"
            type="date"
            value={form.withdrawal_date}
            onChange={handleChange('withdrawal_date')}
            InputLabelProps={{ shrink: true }}
            required
          />

          <TextField
            label="Importo (€)"
            type="number"
            value={form.amount}
            onChange={handleChange('amount')}
            inputProps={{ min: 0, step: 0.01 }}
            required
          />

          <TextField
            label="Nome Dipendente"
            value={form.employee_name}
            onChange={handleChange('employee_name')}
            required
          />

          <TextField
            label="Descrizione / Motivo"
            value={form.description}
            onChange={handleChange('description')}
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Annulla</Button>
        <Button onClick={handleSave} variant="contained" disabled={!valid || saving}>
          {saving ? 'Salvataggio...' : 'Salva'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
