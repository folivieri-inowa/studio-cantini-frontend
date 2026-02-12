'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useSettingsContext } from 'src/components/settings';
import { useSnackbar } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export default function SuggestedRulesView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Valori committed (usati per API call) - carica da localStorage se presente
  const [minOccurrences, setMinOccurrences] = useState(() => {
    const saved = localStorage.getItem('suggestedRules_minOccurrences');
    return saved ? parseInt(saved, 10) : 3;
  });
  const [minConsistency, setMinConsistency] = useState(() => {
    const saved = localStorage.getItem('suggestedRules_minConsistency');
    return saved ? parseInt(saved, 10) : 70;
  });
  
  // Valori temporanei durante drag slider (per preview)
  const [tempOccurrences, setTempOccurrences] = useState(minOccurrences);
  const [tempConsistency, setTempConsistency] = useState(minConsistency);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/classification/suggested-rules?db=${settings.db}&min_occurrences=${minOccurrences}&min_consistency=${minConsistency / 100}`
      );
      const data = await response.json();

      if (data.success) {
        setSuggestions(data.data.suggestions || []);
        setStats(data.data.stats || null);
      } else {
        enqueueSnackbar(data.error || 'Errore caricamento suggerimenti', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [settings.db, minOccurrences, minConsistency, enqueueSnackbar]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleCreateRule = async (suggestion) => {
    setSelectedSuggestion(suggestion);
    setCreateDialogOpen(true);
  };

  const handleConfirmCreateRule = async () => {
    if (!selectedSuggestion) return;

    try {
      // Estrai pattern (prime 2-3 parole significative)
      const pattern = selectedSuggestion.pattern.trim().split(/\s+/).slice(0, 3).join(' ');
      
      // SECURITY FIX: Usa proxy API invece di chiamata diretta (token gestito server-side)
      const response = await fetch(`/api/classification/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db: settings.db,
          rule_name: selectedSuggestion.suggested_rule_name,
          description_patterns: [pattern],
          category_id: selectedSuggestion.suggested_category_id,
          subject_id: selectedSuggestion.suggested_subject_id,
          detail_id: selectedSuggestion.suggested_detail_id,
          confidence: selectedSuggestion.confidence,
          reasoning: `Auto-generata da ${selectedSuggestion.statistics.occurrences} transazioni simili`,
          priority: 60, // Priorità media-alta
          enabled: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        enqueueSnackbar(`✅ Regola creata: ${selectedSuggestion.suggested_rule_name}`, { variant: 'success' });
        setCreateDialogOpen(false);
        setSelectedSuggestion(null);
        // Ricarica suggerimenti per escludere quello appena creato
        fetchSuggestions();
      } else {
        enqueueSnackbar(data.error || 'Errore creazione regola', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      enqueueSnackbar('Errore di rete', { variant: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" gutterBottom>
              Suggerimenti Regole AI
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Il sistema analizza le classificazioni passate e suggerisce nuove regole automatiche
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={fetchSuggestions}
            disabled={loading}
          >
            Aggiorna
          </Button>
        </Stack>

        {/* Stats Card */}
        {stats && (
          <Card sx={{ p: 3 }}>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="h3" color="primary.main">
                  {suggestions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Suggerimenti
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3">{stats.total_feedback_analyzed}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Feedback analizzati
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3">{stats.accepted_feedback}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Classificazioni accettate
                </Typography>
              </Box>
              <Box>
                <Typography variant="h3">{stats.unique_categories}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Categorie utilizzate
                </Typography>
              </Box>
            </Stack>
          </Card>
        )}

        {/* Filters */}
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Filtri
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography gutterBottom>
                Occorrenze minime: {tempOccurrences}
              </Typography>
              <Slider
                value={tempOccurrences}
                onChange={(e, newValue) => setTempOccurrences(newValue)}
                onChangeCommitted={(e, newValue) => {
                  setMinOccurrences(newValue);
                  setTempOccurrences(newValue);
                  // Salva in localStorage
                  localStorage.setItem('suggestedRules_minOccurrences', newValue.toString());
                }}
                min={3}
                max={50}
                step={1}
                marks={[
                  { value: 3, label: '3' },
                  { value: 10, label: '10' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                Numero minimo di transazioni simili per suggerire una regola
              </Typography>
            </Box>
            <Box>
              <Typography gutterBottom>
                Consistenza minima: {tempConsistency}%
              </Typography>
              <Slider
                value={tempConsistency}
                onChange={(e, newValue) => setTempConsistency(newValue)}
                onChangeCommitted={(e, newValue) => {
                  // Salva in localStorage
                  localStorage.setItem('suggestedRules_minConsistency', newValue.toString());
                  setMinConsistency(newValue);
                  setTempConsistency(newValue);
                }}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 70, label: '70%' },
                  { value: 80, label: '80%' },
                  { value: 90, label: '90%' },
                  { value: 100, label: '100%' },
                ]}
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" color="text.secondary">
                Percentuale minima di transazioni classificate allo stesso modo
              </Typography>
            </Box>
          </Stack>
        </Card>

        {/* Suggestions List */}
        {loading ? (
          <Card sx={{ p: 5, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Card>
        ) : (
          suggestions.length === 0 ? (
            <Alert severity="info">
              Nessun suggerimento trovato. Prova ad abbassare i filtri o classifica più transazioni per generare pattern.
            </Alert>
          ) : (
          <Stack spacing={2}>
            {suggestions.map((suggestion, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {suggestion.pattern}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {suggestion.suggested_category_name} › {suggestion.suggested_subject_name}
                        {suggestion.suggested_detail_name && ` › ${suggestion.suggested_detail_name}`}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${suggestion.confidence}%`}
                      color={
                        suggestion.confidence >= 90
                          ? 'success'
                          : suggestion.confidence >= 80
                          ? 'primary'
                          : 'warning'
                      }
                      size="small"
                    />
                    <Chip
                      label={`${suggestion.statistics.occurrences} transazioni`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    {/* Statistics */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Statistiche
                      </Typography>
                      <Stack direction="row" spacing={3}>
                        <Typography variant="body2">
                          Importo medio: <strong>{formatAmount(suggestion.statistics.avg_amount)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Range: {formatAmount(suggestion.statistics.amount_range.min)} - {formatAmount(suggestion.statistics.amount_range.max)}
                        </Typography>
                        <Typography variant="body2">
                          Periodo: {formatDate(suggestion.statistics.date_range.first_seen)} - {formatDate(suggestion.statistics.date_range.last_seen)}
                        </Typography>
                      </Stack>
                    </Box>

                    {/* Examples */}
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Esempi di descrizioni
                      </Typography>
                      <Stack spacing={0.5}>
                        {suggestion.examples.slice(0, 3).map((example, idx) => (
                          <Typography key={idx} variant="body2" color="text.secondary">
                            • {example}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>

                    {/* Action Button */}
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleCreateRule(suggestion)}
                        color="primary"
                      >
                        Crea regola automatica
                      </Button>
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
          )
        )}
      </Stack>

      {/* Create Rule Confirmation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Conferma creazione regola</DialogTitle>
        <DialogContent>
          {selectedSuggestion && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info">
                Stai per creare una regola automatica basata su {selectedSuggestion.statistics.occurrences} transazioni simili.
              </Alert>
              <Box>
                <Typography variant="subtitle2">Pattern:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {selectedSuggestion.pattern}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Classificazione:</Typography>
                <Typography variant="body1">
                  {selectedSuggestion.suggested_category_name} › {selectedSuggestion.suggested_subject_name}
                  {selectedSuggestion.suggested_detail_name && ` › ${selectedSuggestion.suggested_detail_name}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2">Confidence:</Typography>
                <Typography variant="body1">{selectedSuggestion.confidence}%</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleConfirmCreateRule} startIcon={<CheckCircleIcon />}>
            Crea regola
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
