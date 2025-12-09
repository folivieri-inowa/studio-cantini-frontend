'use client';

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import axios, { endpoints } from 'src/utils/axios';
import { useGetCategories } from 'src/api/category';
import { fCurrencyEur } from 'src/utils/format-number';

// ----------------------------------------------------------------------

function EditForm({ result, categories, onSave, db }) {
  const [subjectsList, setSubjectsList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(result.classification?.category_id || null);
  const [selectedSubject, setSelectedSubject] = useState(result.classification?.subject_id || null);
  const [selectedDetail, setSelectedDetail] = useState(result.classification?.detail_id || null);

  // Carica i soggetti quando cambia la categoria
  const fetchSubjects = useCallback(async (categoryId) => {
    if (!categoryId) {
      setSubjectsList([]);
      return;
    }
    try {
      const response = await axios.post(endpoints.subject.list, { db, categoryId });
      const { data: subjectsData } = response.data;
      if (subjectsData) {
        setSubjectsList(subjectsData.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjectsList([]);
    }
  }, [db]);

  // Carica i dettagli quando cambia il soggetto
  const fetchDetails = useCallback(async (subjectId) => {
    if (!subjectId) {
      setDetailsList([]);
      return;
    }
    try {
      const response = await axios.post(endpoints.detail.list, { db, subjectId });
      const { details } = response.data;
      if (details) {
        setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setDetailsList([]);
    }
  }, [db]);

  // Inizializzazione
  useEffect(() => {
    setSelectedCategory(result.classification?.category_id || null);
    setSelectedSubject(result.classification?.subject_id || null);
    setSelectedDetail(result.classification?.detail_id || null);

    if (result.classification?.category_id) {
      fetchSubjects(result.classification.category_id).then(() => {
        if (result.classification?.subject_id) {
          fetchDetails(result.classification.subject_id);
        }
      });
    }
  }, [result, fetchSubjects, fetchDetails]);

  // Gestione cambio categoria
  const handleCategoryChange = (newValue) => {
    const newCategoryId = newValue?.id || null;
    setSelectedCategory(newCategoryId);
    setSelectedSubject(null);
    setSelectedDetail(null);
    setDetailsList([]);
    
    if (newCategoryId) {
      fetchSubjects(newCategoryId);
    } else {
      setSubjectsList([]);
    }

    updateParent(newCategoryId, null, null);
  };

  // Gestione cambio soggetto
  const handleSubjectChange = (newValue) => {
    const newSubjectId = newValue?.id || null;
    setSelectedSubject(newSubjectId);
    setSelectedDetail(null);
    
    if (newSubjectId) {
      fetchDetails(newSubjectId);
    } else {
      setDetailsList([]);
    }

    updateParent(selectedCategory, newSubjectId, null);
  };

  // Gestione cambio dettaglio
  const handleDetailChange = (newValue) => {
    const newDetailId = newValue?.id || null;
    setSelectedDetail(newDetailId);
    updateParent(selectedCategory, selectedSubject, newDetailId);
  };

  const updateParent = (catId, subId, detId) => {
    // Trova i nomi per visualizzazione
    const catName = categories.find(c => c.id === catId)?.name || '';
    const subName = subjectsList.find(s => s.id === subId)?.name || '';
    
    onSave({
      ...result,
      classification: {
        ...result.classification,
        category_id: catId,
        category_name: catName,
        subject_id: subId,
        subject_name: subName,
        detail_id: detId,
      }
    });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Modifica Classificazione
      </Typography>
      
      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
        <Typography variant="body2" fontWeight="bold">
          {result.description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Importo: {result.amount} € | Data: {new Date(result.date).toLocaleDateString()}
        </Typography>
      </Box>

      <Stack spacing={3}>
        <Autocomplete
          fullWidth
          options={categories || []}
          value={categories?.find((c) => c.id === selectedCategory) || null}
          onChange={(e, v) => handleCategoryChange(v)}
          getOptionLabel={(option) => option.name || ''}
          renderInput={(params) => <TextField {...params} label="Categoria" />}
        />

        <Autocomplete
          fullWidth
          options={subjectsList || []}
          value={subjectsList?.find((s) => s.id === selectedSubject) || null}
          onChange={(e, v) => handleSubjectChange(v)}
          getOptionLabel={(option) => option.name || ''}
          disabled={!selectedCategory}
          renderInput={(params) => <TextField {...params} label="Soggetto" />}
        />

        <Autocomplete
          fullWidth
          options={detailsList || []}
          value={detailsList?.find((d) => d.id === selectedDetail) || null}
          onChange={(e, v) => handleDetailChange(v)}
          getOptionLabel={(option) => option.name || ''}
          disabled={!selectedSubject}
          renderInput={(params) => <TextField {...params} label="Dettaglio (opzionale)" />}
        />
      </Stack>
    </Box>
  );
}

EditForm.propTypes = {
  result: PropTypes.object,
  categories: PropTypes.array,
  onSave: PropTypes.func,
  db: PropTypes.string,
};

export default function AutoClassifyMultiButton({ 
  selectedIds, 
  transactions, 
  onUpdate, 
  disabled = false 
}) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [selectedResultId, setSelectedResultId] = useState(null);

  const settings = useSettingsContext();
  const { categories } = useGetCategories(settings.db);

  // Filtra le transazioni selezionate
  const selectedTransactions = transactions?.filter((t) => selectedIds.includes(t.id)) || [];

  const handleStartClassification = () => {
    setDialogOpen(true);
    setResults([]);
    setProgress(0);
    setError(null);
    setSelectedResultId(null);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setResults([]);
    setProgress(0);
    setSelectedResultId(null);
  };

  const handleClassify = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResultId(null);

    const totalCount = selectedTransactions.length;
    const classificationResults = [];

    try {
      // Classifica una transazione alla volta per mostrare il progresso
      for (let i = 0; i < selectedTransactions.length; i += 1) {
        const transaction = selectedTransactions[i];
        
        try {
          // eslint-disable-next-line no-await-in-loop
          const response = await fetch('/api/prima-nota/auto-classify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: {
                id: transaction.id,
                description: transaction.description,
                dare: transaction.amount > 0 ? transaction.amount : '',
                avere: transaction.amount < 0 ? Math.abs(transaction.amount) : '',
                data: transaction.date,
              },
              db: settings.db,
            }),
          });

          // eslint-disable-next-line no-await-in-loop
          const result = await response.json();

          if (response.ok && result.classification) {
            classificationResults.push({
              id: transaction.id,
              description: transaction.description,
              amount: transaction.amount,
              date: transaction.date,
              success: true,
              classification: result.classification,
              originalTransaction: transaction,
            });
          } else {
            classificationResults.push({
              id: transaction.id,
              description: transaction.description,
              amount: transaction.amount,
              date: transaction.date,
              success: false,
              error: result.error || 'Classificazione fallita',
              originalTransaction: transaction,
            });
          }
        } catch (err) {
          classificationResults.push({
            id: transaction.id,
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date,
            success: false,
            error: err.message,
            originalTransaction: transaction,
          });
        }

        setProgress(((i + 1) / totalCount) * 100);
        setResults([...classificationResults]);
      }
      
      // Seleziona il primo risultato se disponibile
      if (classificationResults.length > 0) {
        setSelectedResultId(classificationResults[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateResult = (updatedResult) => {
    setResults(prev => prev.map(r => r.id === updatedResult.id ? updatedResult : r));
  };

  const handleApplyAll = async () => {
    setLoading(true);

    try {
      // Applica tutte le classificazioni riuscite
      const successfulResults = results.filter((r) => r.success);

      // Uso Promise.all con map invece di for-of
      await Promise.all(
        successfulResults.map((result) => {
          const t = result.originalTransaction;
          return fetch('/api/prima-nota/edit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: t.id,
              owner: t.owner,
              date: t.date,
              amount: t.amount,
              description: t.description,
              paymentType: t.paymentType || '',
              note: t.note || '',
              category: result.classification.category_id,
              subject: result.classification.subject_id,
              details: result.classification.detail_id || '',
              status: 'completed',
              db: settings.db,
              documents: t.documents || [],
              excludedFromStats: t.excludedFromStats || false,
            }),
          });
        })
      );

      if (onUpdate) {
        onUpdate();
      }

      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;
  const selectedResult = results.find(r => r.id === selectedResultId);

  return (
    <>
      <Tooltip title="Auto-classifica selezionati con AI (Beta)">
        <IconButton
          color="secondary"
          onClick={handleStartClassification}
          disabled={disabled || selectedIds.length === 0}
        >
          <Iconify icon="solar:magic-stick-3-bold" />
        </IconButton>
      </Tooltip>

      <Dialog 
        open={dialogOpen} 
        onClose={handleClose} 
        maxWidth="xl" 
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:magic-stick-3-bold" color="secondary.main" width={24} />
            <span>Auto-classificazione multipla</span>
            <Chip label="BETA" size="small" color="secondary" variant="outlined" />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0 }}>
          {/* Info iniziale */}
          {!loading && results.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
              <Iconify 
                icon="solar:magic-stick-3-bold-duotone" 
                width={80} 
                sx={{ color: 'secondary.main', mb: 3 }} 
              />
              <Typography variant="h5" gutterBottom>
                Classifica {selectedTransactions.length} transazioni
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                L&apos;intelligenza artificiale analizzerà le transazioni selezionate e proporrà una classificazione
                basata sullo storico. Potrai rivedere e modificare le proposte prima di salvare.
              </Typography>
            </Box>
          )}

          {/* Progress bar durante la classificazione */}
          {loading && results.length < selectedTransactions.length && (
            <Box sx={{ py: 8, px: 4, textAlign: 'center' }}>
              <CircularProgress size={40} color="secondary" sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Analisi in corso... ({results.length}/{selectedTransactions.length})
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                color="secondary"
                sx={{ height: 10, borderRadius: 1, maxWidth: 600, mx: 'auto', mt: 2 }}
              />
            </Box>
          )}

          {/* Risultati Split View */}
          {results.length > 0 && results.length === selectedTransactions.length && (
            <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
              {/* Colonna Sinistra: Lista */}
              <Grid item xs={12} md={4} sx={{ borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={`${successCount} OK`}
                      color="success"
                      size="small"
                      variant="soft"
                    />
                    {failCount > 0 && (
                      <Chip 
                        label={`${failCount} Errori`}
                        color="error"
                        size="small"
                        variant="soft"
                      />
                    )}
                  </Stack>
                </Box>
                <Box sx={{ overflow: 'auto', flex: 1 }}>
                  {results.map((result) => (
                    <Box
                      key={result.id}
                      onClick={() => setSelectedResultId(result.id)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selectedResultId === result.id ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Iconify
                          icon={result.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                          color={result.success ? 'success.main' : 'error.main'}
                          width={20}
                          sx={{ mt: 0.5, flexShrink: 0 }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle2" noWrap>
                            {result.description}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {fCurrencyEur(result.amount)}
                          </Typography>
                          {result.success && (
                            <Typography variant="caption" color="primary.main" noWrap sx={{ fontWeight: 'bold' }}>
                              {result.classification.category_name} &gt; {result.classification.subject_name}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Colonna Destra: Edit Form */}
              <Grid item xs={12} md={8} sx={{ overflow: 'auto', bgcolor: 'background.default' }}>
                {selectedResult ? (
                  <EditForm 
                    result={selectedResult} 
                    categories={categories} 
                    onSave={handleUpdateResult}
                    db={settings.db}
                  />
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Typography>Seleziona una transazione per modificarla</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.lighter', color: 'error.dark' }}>
              <Typography variant="subtitle2">Errore: {error}</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Annulla
          </Button>
          
          {results.length === 0 && (
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={handleClassify}
              loading={loading}
              startIcon={<Iconify icon="solar:magic-stick-3-bold" />}
            >
              Avvia classificazione
            </LoadingButton>
          )}

          {results.length > 0 && successCount > 0 && (
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleApplyAll}
              loading={loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Salva tutto ({successCount})
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

AutoClassifyMultiButton.propTypes = {
  selectedIds: PropTypes.array.isRequired,
  transactions: PropTypes.array,
  onUpdate: PropTypes.func,
  disabled: PropTypes.bool,
};
