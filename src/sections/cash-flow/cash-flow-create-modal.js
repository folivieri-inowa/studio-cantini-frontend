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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

import axios from 'src/utils/axios';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

export function CashFlowCreateModal({ open, onClose, onSave }) {
  const { db } = useSettingsContext();

  // Owner state
  const [owners, setOwners] = useState([]);

  // Association toggle
  const [associateTx, setAssociateTx] = useState(false);

  // Filter state
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [details, setDetails] = useState([]);
  const [matchingTxs, setMatchingTxs] = useState([]);

  const [filters, setFilters] = useState({ category: '', subject: '', detail: '' });
  const [selectedTx, setSelectedTx] = useState('');
  const [loadingTxs, setLoadingTxs] = useState(false);

  // Form state
  const [form, setForm] = useState({
    owner_id: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    amount: '',
    employee_name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  // Reset everything
  const resetAll = useCallback(() => {
    setForm({
      owner_id: '',
      withdrawal_date: new Date().toISOString().split('T')[0],
      amount: '',
      employee_name: '',
      description: '',
    });
    setAssociateTx(false);
    setFilters({ category: '', subject: '', detail: '' });
    setSelectedTx('');
    setCategories([]);
    setSubjects([]);
    setDetails([]);
    setMatchingTxs([]);
  }, []);

  // Load owners on open
  useEffect(() => {
    if (open && db) {
      axios.get('/api/owner/list', { params: { db } }).then((res) => {
        setOwners(res.data?.data || []);
      }).catch(() => {});
      resetAll();
    }
  }, [open, db, resetAll]);

  // Load categories
  useEffect(() => {
    if (!associateTx || !db) return;
    axios.get('/api/category/list', { params: { db } }).then((res) => {
      setCategories(res.data?.data || []);
    }).catch(() => {});
  }, [associateTx, db]);

  // Load subjects when category changes
  useEffect(() => {
    if (!associateTx || !filters.category || !db) { setSubjects([]); return; }
    axios.post('/api/subject/list', { db, categoryId: filters.category }).then((res) => {
      setSubjects(res.data?.data || []);
    }).catch(() => {});
  }, [associateTx, filters.category, db]);

  // Load details when subject changes
  useEffect(() => {
    if (!associateTx || !filters.subject || !db) { setDetails([]); return; }
    axios.post('/api/detail/list', { db, subjectId: filters.subject }).then((res) => {
      setDetails(res.data?.data || []);
    }).catch(() => {});
  }, [associateTx, filters.subject, db]);

  // Search transactions - load full list and filter client-side
  useEffect(() => {
    if (!associateTx || !form.owner_id || !db) { setMatchingTxs([]); return; }
    setLoadingTxs(true);
    axios.get('/api/prima-nota/list', { params: { db } }).then((res) => {
      let all = res.data?.data || [];
      // Filter by owner
      all = all.filter((tx) => tx.ownerid === form.owner_id);
      // Filter negative amounts (withdrawals/expenses)
      all = all.filter((tx) => parseFloat(tx.amount) < 0);
      // Optional category filter
      if (filters.category) {
        all = all.filter((tx) => tx.categoryid === filters.category);
      }
      // Optional subject filter
      if (filters.subject) {
        all = all.filter((tx) => tx.subjectid === filters.subject);
      }
      // Optional detail filter
      if (filters.detail) {
        all = all.filter((tx) => tx.detailid === filters.detail);
      }
      // Sort by date desc, show last 100
      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMatchingTxs(all.slice(0, 100));
    }).catch(() => { setMatchingTxs([]); }).finally(() => setLoadingTxs(false));
  }, [associateTx, form.owner_id, filters.category, filters.subject, filters.detail, db]);

  // Form handlers
  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFilterChange = (field) => (e) => {
    const val = e.target.value;
    setFilters((prev) => {
      const next = { ...prev, [field]: val };
      if (field === 'category') { next.subject = ''; next.detail = ''; }
      if (field === 'subject') { next.detail = ''; }
      return next;
    });
    setSelectedTx('');
  };

  const handleTxSelect = (e) => {
    const txId = e.target.value;
    setSelectedTx(txId);
    const tx = matchingTxs.find((t) => t.id === txId);
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
    const desc = (tx.description || '').substring(0, 50);
    const amt = `€${Math.abs(parseFloat(tx.amount || 0)).toFixed(2).replace('.', ',')}`;
    return `${date} — ${amt} — ${desc}`;
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

          {/* Association section */}
          <FormControlLabel
            control={
              <Switch
                checked={associateTx}
                onChange={(e) => setAssociateTx(e.target.checked)}
              />
            }
            label="Associa a movimento di Prima Nota"
          />

          {associateTx && form.owner_id && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Filtra movimenti
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Categoria"
                  value={filters.category}
                  onChange={handleFilterChange('category')}
                  size="small"
                >
                  <MenuItem value="">Tutte</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>

                {filters.category && (
                  <TextField
                    select
                    label="Soggetto"
                    value={filters.subject}
                    onChange={handleFilterChange('subject')}
                    size="small"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {subjects.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </TextField>
                )}

                {filters.subject && (
                  <TextField
                    select
                    label="Dettaglio"
                    value={filters.detail}
                    onChange={handleFilterChange('detail')}
                    size="small"
                  >
                    <MenuItem value="">Tutti</MenuItem>
                    {details.map((d) => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                )}

                <TextField
                  select
                  label="Movimento"
                  value={selectedTx}
                  onChange={handleTxSelect}
                  size="small"
                  disabled={loadingTxs || !matchingTxs.length}
                >
                  <MenuItem value="">
                    <em>{loadingTxs ? 'Caricamento...' : matchingTxs.length ? 'Seleziona...' : 'Nessun movimento trovato'}</em>
                  </MenuItem>
                  {matchingTxs.map((tx) => (
                    <MenuItem key={tx.id} value={tx.id}>
                      {formatTxLabel(tx)}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Paper>
          )}
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
