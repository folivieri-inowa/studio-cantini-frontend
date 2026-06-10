'use client';

import { useState } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const CATEGORIES = [
  { value: 'carburante', label: 'Carburante' },
  { value: 'cancelleria', label: 'Cancelleria' },
  { value: 'vitto', label: 'Vitto' },
  { value: 'trasporto', label: 'Trasporto' },
  { value: 'utenze', label: 'Utenze' },
  { value: 'manutenzione', label: 'Manutenzione' },
  { value: 'altro', label: 'Altro' },
];

// ----------------------------------------------------------------------

export function CashFlowExpenseForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    expense_date: initial?.expense_date || new Date().toISOString().split('T')[0],
    amount: initial?.amount || '',
    category: initial?.category || '',
    recipient: initial?.recipient || '',
    description: initial?.description || '',
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = () => {
    if (!form.expense_date || !form.amount) return;
    onSave({
      ...form,
      amount: parseFloat(form.amount),
      id: initial?.id,
    });
  };

  const valid = form.expense_date && form.amount;

  return (
    <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Data Spesa"
            type="date"
            value={form.expense_date}
            onChange={handleChange('expense_date')}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ width: 180 }}
            required
          />
          <TextField
            label="Importo (€)"
            type="number"
            value={form.amount}
            onChange={handleChange('amount')}
            inputProps={{ min: 0, step: 0.01 }}
            size="small"
            sx={{ width: 150 }}
            required
          />
          <TextField
            select
            label="Categoria"
            value={form.category}
            onChange={handleChange('category')}
            size="small"
            sx={{ width: 180 }}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Beneficiario / Fornitore"
            value={form.recipient}
            onChange={handleChange('recipient')}
            size="small"
            fullWidth
          />
          <TextField
            label="Descrizione"
            value={form.description}
            onChange={handleChange('description')}
            size="small"
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onCancel && <Button onClick={onCancel} size="small" color="inherit">Annulla</Button>}
          <Button onClick={handleSave} variant="contained" size="small" disabled={!valid || saving}>
            {saving ? 'Salvataggio...' : initial?.id ? 'Aggiorna' : 'Aggiungi Spesa'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
