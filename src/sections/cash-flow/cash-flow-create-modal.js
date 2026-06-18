'use client';

import { useState, useEffect, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

import axios from 'src/utils/axios';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

export function CashFlowCreateModal({ open, onClose, onSave }) {
  const { db } = useSettingsContext();
  const [owners, setOwners] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState('');
  const [form, setForm] = useState({
    owner_id: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    amount: '',
    employee_name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const resetForm = useCallback(() => {
    setForm({
      owner_id: '',
      withdrawal_date: new Date().toISOString().split('T')[0],
      amount: '',
      employee_name: '',
      description: '',
    });
    setSelectedTx('');
    setTransactions([]);
  }, []);

  useEffect(() => {
    if (open && db) {
      axios.get('/api/owner/list', { params: { db } }).then((res) => {
        setOwners(res.data?.data || []);
      }).catch(() => {});
      resetForm();
    }
  }, [open, db, resetForm]);

  // Load transactions when owner changes
  const loadTransactions = useCallback(async (ownerId) => {
    if (!db || !ownerId) { setTransactions([]); return; }
    try {
      const res = await axios.get('/api/prima-nota/list', { params: { db } });
      const all = res.data?.data || [];
      // Filter by owner and sort by date desc
      const filtered = all
        .filter((tx) => tx.ownerid === ownerId)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 50); // last 50 transactions
      setTransactions(filtered);
    } catch { setTransactions([]); }
  }, [db]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
    if (field === 'owner_id') {
      loadTransactions(val);
      setSelectedTx('');
    }
  };

  const handleTxSelect = (e) => {
    const txId = e.target.value;
    setSelectedTx(txId);
    const tx = transactions.find((t) => t.id === txId);
    if (tx) {
      setForm((prev) => ({
        ...prev,
        amount: Math.abs(tx.amount)?.toString() || prev.amount,
        withdrawal_date: tx.date?.split('T')[0] || prev.withdrawal_date,
        description: tx.description || prev.description,
      }));
    }
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
        transaction_id: selectedTx || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const valid = form.owner_id && form.withdrawal_date && form.amount && form.employee_name;

  const formatTxLabel = (tx) => {
    const date = tx.date?.split('T')[0] || '?';
    const desc = (tx.description || tx.note || '').substring(0, 40);
    const amt = `€${Math.abs(tx.amount || 0).toFixed(2).replace('.', ',')}`;
    return `${date} - ${amt} - ${desc}`;
  };

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

          <Divider />
          <Typography variant="caption" color="text.secondary">
            Movimento Prima Nota (opzionale — precompila i campi)
          </Typography>
          <TextField
            select
            label="Associa Movimento"
            value={selectedTx}
            onChange={handleTxSelect}
            disabled={!form.owner_id || !transactions.length}
          >
            <MenuItem value="">
              <em>Nessuno (crea senza collegamento)</em>
            </MenuItem>
            {transactions.map((tx) => (
              <MenuItem key={tx.id} value={tx.id}>
                {formatTxLabel(tx)}
              </MenuItem>
            ))}
          </TextField>
          <Divider />

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
