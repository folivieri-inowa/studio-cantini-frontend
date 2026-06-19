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
import Paper from '@mui/material/Paper';

import axios from 'src/utils/axios';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

function formatTxLabel(tx) {
  const date = tx.date?.split('T')[0] || '?';
  const desc = (tx.description || '').substring(0, 50);
  const amt = `€${Math.abs(parseFloat(tx.amount || 0)).toFixed(2).replace('.', ',')}`;
  return `${date} — ${amt} — ${desc}`;
}

export function CashFlowEditModal({ open, onClose, onSave, item }) {
  const { db } = useSettingsContext();
  const [owners, setOwners] = useState([]);
  const [saving, setSaving] = useState(false);

  // Association state
  const [associateTx, setAssociateTx] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [details, setDetails] = useState([]);
  const [matchingTxs, setMatchingTxs] = useState([]);
  const [filters, setFilters] = useState({ category: '', subject: '', detail: '' });
  const [selectedTx, setSelectedTx] = useState(item?.transaction_id || '');
  const [loadingTxs, setLoadingTxs] = useState(false);

  const [form, setForm] = useState({
    owner_id: '',
    withdrawal_date: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    if (open && item) {
      axios.get('/api/owner/list', { params: { db } }).then((res) => {
        setOwners(res.data?.data || []);
      }).catch(() => {});
      setForm({
        owner_id: item.owner_id || '',
        withdrawal_date: item.withdrawal_date || '',
        amount: item.amount?.toString() || '',
        description: item.description || '',
      });
      setSelectedTx(item.transaction_id || '');
      setAssociateTx(false);
      setFilters({ category: '', subject: '', detail: '' });
      setMatchingTxs([]);
    }
  }, [open, item, db]);

  // Load categories when association is toggled
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

  // Search transactions
  useEffect(() => {
    if (!associateTx || !form.owner_id || !db) { setMatchingTxs([]); return; }
    setLoadingTxs(true);
    axios.get('/api/prima-nota/list', { params: { db } }).then((res) => {
      let all = res.data?.data || [];
      all = all.filter((tx) => tx.ownerid === form.owner_id);
      all = all.filter((tx) => parseFloat(tx.amount) < 0);
      if (filters.category) all = all.filter((tx) => tx.categoryid === filters.category);
      if (filters.subject) all = all.filter((tx) => tx.subjectid === filters.subject);
      if (filters.detail) all = all.filter((tx) => tx.detailid === filters.detail);
      all.sort((a, b) => new Date(b.date) - new Date(a.date));
      setMatchingTxs(all.slice(0, 100));
    }).catch(() => { setMatchingTxs([]); }).finally(() => setLoadingTxs(false));
  }, [associateTx, form.owner_id, filters.category, filters.subject, filters.detail, db]);

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
  };

  const handleSave = async () => {
    if (!form.withdrawal_date) return;
    setSaving(true);
    try {
      const payload = {
        withdrawal_date: form.withdrawal_date,
        description: form.description || undefined,
      };
      if (item?.status === 'open') {
        payload.owner_id = form.owner_id || undefined;
        payload.amount = form.amount ? parseFloat(form.amount) : undefined;
      }
      // Always allow updating transaction link
      payload.transaction_id = selectedTx || null;
      await onSave(item.id, payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

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
              <TextField label="Descrizione" value={form.description} onChange={handleChange('description')} multiline rows={2} />
            </>
          )}

          {/* Association section — always available */}
          {item?.transaction_id && !associateTx && (
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'info.lighter' }}>
              <Typography variant="body2" color="info.dark">
                🔗 Collegato a movimento Prima Nota
              </Typography>
              {item.transaction_date && (
                <Typography variant="caption" color="text.secondary">
                  {item.transaction_date} — {item.transaction_description?.substring(0, 60)}
                </Typography>
              )}
            </Paper>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={associateTx}
                onChange={(e) => setAssociateTx(e.target.checked)}
              />
            }
            label={item?.transaction_id ? 'Cambia associazione' : 'Associa a movimento di Prima Nota'}
          />

          {associateTx && form.owner_id && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Filtra movimenti</Typography>
              <Stack spacing={2}>
                <TextField select label="Categoria" value={filters.category} onChange={handleFilterChange('category')} size="small">
                  <MenuItem value="">Tutte</MenuItem>
                  {categories.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                </TextField>
                {filters.category && (
                  <TextField select label="Soggetto" value={filters.subject} onChange={handleFilterChange('subject')} size="small">
                    <MenuItem value="">Tutti</MenuItem>
                    {subjects.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                  </TextField>
                )}
                {filters.subject && (
                  <TextField select label="Dettaglio" value={filters.detail} onChange={handleFilterChange('detail')} size="small">
                    <MenuItem value="">Tutti</MenuItem>
                    {details.map((d) => (<MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>))}
                  </TextField>
                )}
                <TextField select label="Movimento" value={selectedTx} onChange={(e) => setSelectedTx(e.target.value)} size="small" disabled={loadingTxs || !matchingTxs.length}>
                  <MenuItem value="">{item?.transaction_id ? 'Nessuno (scollega)' : loadingTxs ? 'Caricamento...' : matchingTxs.length ? 'Seleziona...' : 'Nessun movimento trovato'}</MenuItem>
                  {matchingTxs.map((tx) => (<MenuItem key={tx.id} value={tx.id}>{formatTxLabel(tx)}</MenuItem>))}
                </TextField>
              </Stack>
            </Paper>
          )}
          {associateTx && !form.owner_id && (
            <Typography variant="body2" color="text.secondary">Seleziona prima un Conto Corrente</Typography>
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
