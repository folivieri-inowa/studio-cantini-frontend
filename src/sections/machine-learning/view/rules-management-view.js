'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';
import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export default function RulesManagementView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [filterEnabled, setFilterEnabled] = useState('all'); // 'all' | 'enabled' | 'disabled'
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);

  // Form state per create/edit
  const [formData, setFormData] = useState({
    rule_name: '',
    priority: 50,
    enabled: true,
    description_patterns: '',
    amount_min: '',
    amount_max: '',
    confidence: 95,
    reasoning: '',
    category_id: '',
    subject_id: '',
    detail_id: '',
  });

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterEnabled === 'all' 
        ? `/api/classification/rules?db=${settings.db}`
        : `/api/classification/rules?db=${settings.db}&enabled=${filterEnabled === 'enabled'}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setRules(data.data || []);
      } else {
        enqueueSnackbar(data.error || 'Errore caricamento regole', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [settings.db, filterEnabled, enqueueSnackbar]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleEdit = (rule) => {
    setSelectedRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      priority: rule.priority,
      enabled: rule.enabled,
      description_patterns: (rule.description_patterns || []).join(', '),
      amount_min: rule.amount_min || '',
      amount_max: rule.amount_max || '',
      confidence: rule.confidence,
      reasoning: rule.reasoning || '',
    });
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setFormData({
      rule_name: '',
      priority: 50,
      enabled: true,
      description_patterns: '',
      amount_min: '',
      amount_max: '',
      confidence: 95,
      reasoning: '',
      category_id: '',
      subject_id: '',
      detail_id: '',
    });
    setCreateDialogOpen(true);
  };

  const handleDelete = (rule) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleToggleEnabled = async (rule) => {
    try {
      const response = await fetch(`/api/classification/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !rule.enabled }),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar(`Regola ${!rule.enabled ? 'attivata' : 'disattivata'}`, { variant: 'success' });
        fetchRules();
      } else {
        enqueueSnackbar(data.error || 'Errore aggiornamento regola', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = {
        priority: parseInt(formData.priority, 10),
        enabled: formData.enabled,
        description_patterns: formData.description_patterns
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0),
        amount_min: formData.amount_min ? parseFloat(formData.amount_min) : null,
        amount_max: formData.amount_max ? parseFloat(formData.amount_max) : null,
        confidence: parseInt(formData.confidence, 10),
        reasoning: formData.reasoning || null,
      };

      const response = await fetch(`/api/classification/rules/${selectedRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar('Regola aggiornata con successo', { variant: 'success' });
        setEditDialogOpen(false);
        fetchRules();
      } else {
        enqueueSnackbar(data.error || 'Errore aggiornamento regola', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error updating rule:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    }
  };

  const handleSaveCreate = async () => {
    try {
      const payload = {
        db: settings.db,
        rule_name: formData.rule_name,
        priority: parseInt(formData.priority, 10),
        enabled: formData.enabled,
        description_patterns: formData.description_patterns
          .split(',')
          .map(p => p.trim())
          .filter(p => p.length > 0),
        amount_min: formData.amount_min ? parseFloat(formData.amount_min) : null,
        amount_max: formData.amount_max ? parseFloat(formData.amount_max) : null,
        confidence: parseInt(formData.confidence, 10),
        reasoning: formData.reasoning || null,
        category_id: formData.category_id,
        subject_id: formData.subject_id,
        detail_id: formData.detail_id || null,
      };

      const response = await fetch(`/api/classification/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar('Regola creata con successo', { variant: 'success' });
        setCreateDialogOpen(false);
        fetchRules();
      } else {
        enqueueSnackbar(data.error || 'Errore creazione regola', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/classification/rules/${selectedRule.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar('Regola eliminata con successo', { variant: 'success' });
        setDeleteDialogOpen(false);
        setSelectedRule(null);
        fetchRules();
      } else {
        enqueueSnackbar(data.error || 'Errore eliminazione regola', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    }
  };

  const filteredRules = rules;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" gutterBottom>
              Gestione Regole di Classificazione
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crea, modifica ed elimina regole per la classificazione automatica delle transazioni
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              onClick={fetchRules}
              disabled={loading}
            >
              Aggiorna
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreate}
            >
              Nuova Regola
            </Button>
          </Stack>
        </Stack>

        {/* Stats Card */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={4} flexWrap="wrap">
            <Box>
              <Typography variant="h3" color="primary.main">
                {rules.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Regole Totali
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" color="success.main">
                {rules.filter(r => r.enabled).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attive
              </Typography>
            </Box>
            <Box>
              <Typography variant="h3" color="error.main">
                {rules.filter(r => !r.enabled).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Disabilitate
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Filters */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Stato</InputLabel>
              <Select
                value={filterEnabled}
                label="Stato"
                onChange={(e) => setFilterEnabled(e.target.value)}
              >
                <MenuItem value="all">Tutte</MenuItem>
                <MenuItem value="enabled">Solo Attive</MenuItem>
                <MenuItem value="disabled">Solo Disabilitate</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Card>

        {/* Rules Table */}
        {loading ? (
          <Card sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Card>
        ) : filteredRules.length === 0 ? (
          <Alert severity="info">
            Nessuna regola trovata. Crea una nuova regola per iniziare.
          </Alert>
        ) : (
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stato</TableCell>
                    <TableCell>Nome Regola</TableCell>
                    <TableCell>Priorità</TableCell>
                    <TableCell>Pattern</TableCell>
                    <TableCell>Classificazione</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell align="right">Azioni</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Chip
                          label={rule.enabled ? 'Attiva' : 'Disabilitata'}
                          color={rule.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{rule.rule_name}</Typography>
                        {rule.reasoning && (
                          <Typography variant="caption" color="text.secondary">
                            {rule.reasoning}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.priority} size="small" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ maxWidth: 250 }}>
                          {rule.description_patterns && rule.description_patterns.length > 0 ? (
                            <Stack spacing={0.5}>
                              {rule.description_patterns.slice(0, 2).map((pattern, idx) => (
                                <Typography key={idx} variant="caption" sx={{ fontFamily: 'monospace' }}>
                                  {pattern}
                                </Typography>
                              ))}
                              {rule.description_patterns.length > 2 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{rule.description_patterns.length - 2} altri
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Nessun pattern
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{rule.category_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          › {rule.subject_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${rule.confidence}%`}
                          color={
                            rule.confidence >= 90
                              ? 'success'
                              : rule.confidence >= 80
                              ? 'primary'
                              : 'warning'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={rule.enabled ? 'Disabilita' : 'Abilita'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleEnabled(rule)}
                              color={rule.enabled ? 'success' : 'default'}
                            >
                              {rule.enabled ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Modifica">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(rule)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Elimina">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(rule)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Stack>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Modifica Regola</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Nome Regola"
              value={formData.rule_name}
              disabled
              fullWidth
              helperText="Il nome non può essere modificato"
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Priorità"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                fullWidth
                helperText="Maggiore = più priorità (0-100)"
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                label="Confidence"
                type="number"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                fullWidth
                helperText="Percentuale di confidenza (0-100)"
                inputProps={{ min: 0, max: 100 }}
              />
            </Stack>

            <TextField
              label="Pattern (separati da virgola)"
              value={formData.description_patterns}
              onChange={(e) => setFormData({ ...formData, description_patterns: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Regex patterns per matching descrizione. Es: INPS.*RIF.*025, CBILL"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Importo Min"
                type="number"
                value={formData.amount_min}
                onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                fullWidth
                helperText="Importo minimo (lascia vuoto per nessun limite)"
              />
              <TextField
                label="Importo Max"
                type="number"
                value={formData.amount_max}
                onChange={(e) => setFormData({ ...formData, amount_max: e.target.value })}
                fullWidth
                helperText="Importo massimo (lascia vuoto per nessun limite)"
              />
            </Stack>

            <TextField
              label="Motivazione"
              value={formData.reasoning}
              onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Descrizione del motivo di questa regola"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="Regola Attiva"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Salva Modifiche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Conferma Eliminazione</DialogTitle>
        <DialogContent>
          <Typography>
            Sei sicuro di voler eliminare la regola <strong>{selectedRule?.rule_name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Questa azione non può essere annullata. Le transazioni future non saranno più classificate
            automaticamente da questa regola.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crea Nuova Regola</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Nome Regola"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              fullWidth
              required
              helperText="Nome descrittivo per identificare la regola"
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label="Priorità"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                fullWidth
                helperText="Maggiore = più priorità (0-100)"
                inputProps={{ min: 0, max: 100 }}
              />
              <TextField
                label="Confidence"
                type="number"
                value={formData.confidence}
                onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                fullWidth
                helperText="Percentuale di confidenza (0-100)"
                inputProps={{ min: 0, max: 100 }}
              />
            </Stack>

            <TextField
              label="Pattern (separati da virgola)"
              value={formData.description_patterns}
              onChange={(e) => setFormData({ ...formData, description_patterns: e.target.value })}
              fullWidth
              multiline
              rows={3}
              helperText="Regex patterns per matching descrizione. Es: INPS.*RIF.*025, CBILL"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Importo Min"
                type="number"
                value={formData.amount_min}
                onChange={(e) => setFormData({ ...formData, amount_min: e.target.value })}
                fullWidth
                helperText="Importo minimo (lascia vuoto per nessun limite)"
              />
              <TextField
                label="Importo Max"
                type="number"
                value={formData.amount_max}
                onChange={(e) => setFormData({ ...formData, amount_max: e.target.value })}
                fullWidth
                helperText="Importo massimo (lascia vuoto per nessun limite)"
              />
            </Stack>

            <Alert severity="info">
              Per trovare gli ID di categoria/soggetto, consulta il database o usa l&apos;interfaccia
              di gestione categorie.
            </Alert>

            <TextField
              label="Category ID (UUID)"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              fullWidth
              required
              helperText="UUID della categoria di destinazione"
            />

            <TextField
              label="Subject ID (UUID)"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              fullWidth
              required
              helperText="UUID del soggetto di destinazione"
            />

            <TextField
              label="Detail ID (UUID) - Opzionale"
              value={formData.detail_id}
              onChange={(e) => setFormData({ ...formData, detail_id: e.target.value })}
              fullWidth
              helperText="UUID del dettaglio (lascia vuoto se non necessario)"
            />

            <TextField
              label="Motivazione"
              value={formData.reasoning}
              onChange={(e) => setFormData({ ...formData, reasoning: e.target.value })}
              fullWidth
              multiline
              rows={2}
              helperText="Descrizione del motivo di questa regola"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
              }
              label="Regola Attiva"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button 
            onClick={handleSaveCreate} 
            variant="contained"
            disabled={!formData.rule_name || !formData.category_id || !formData.subject_id}
          >
            Crea Regola
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
