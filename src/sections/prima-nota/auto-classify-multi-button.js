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
import Checkbox from '@mui/material/Checkbox';
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

import { useSnackbar } from 'notistack';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';
import axios, { endpoints } from 'src/utils/axios';
import { useGetCategories } from 'src/api/category';
import { fCurrencyEur } from 'src/utils/format-number';

// ----------------------------------------------------------------------

function EditForm({ result, categories, onSave, db, excluded, onToggleExclude }) {
  const { enqueueSnackbar } = useSnackbar();
  const [subjectsList, setSubjectsList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState(result.classification?.category_id || null);
  const [selectedSubject, setSelectedSubject] = useState(result.classification?.subject_id || null);
  const [selectedDetail, setSelectedDetail] = useState(result.classification?.detail_id || null);

  // Stati per i dialog di creazione
  const [openNewCategoryDialog, setOpenNewCategoryDialog] = useState(false);
  const [openNewSubjectDialog, setOpenNewSubjectDialog] = useState(false);
  const [openNewDetailDialog, setOpenNewDetailDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newDetailName, setNewDetailName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [creatingDetail, setCreatingDetail] = useState(false);

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
      const { data: details } = response.data;
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
    const loadClassification = async () => {
      setSelectedCategory(result.classification?.category_id || null);

      if (result.classification?.category_id) {
        await fetchSubjects(result.classification.category_id);
        setSelectedSubject(result.classification?.subject_id || null);
        
        if (result.classification?.subject_id) {
          await fetchDetails(result.classification.subject_id);
          setSelectedDetail(result.classification?.detail_id || null);
        }
      } else {
        setSelectedSubject(null);
        setSelectedDetail(null);
      }
    };
    
    loadClassification();
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

  const updateParent = async (catId, subId, detId) => {
    // Trova i nomi per visualizzazione
    const catName = categories.find(c => c.id === catId)?.name || '';
    const subName = subjectsList.find(s => s.id === subId)?.name || '';
    const detName = detailsList.find(d => d.id === detId)?.name || null;
    
    const updatedResult = {
      ...result,
      classification: {
        ...result.classification,
        category_id: catId,
        category_name: catName,
        subject_id: subId,
        subject_name: subName,
        detail_id: detId,
        detail_name: detName,
      }
    };
    
    onSave(updatedResult);
    
    // Salva il feedback per learning (solo se c'è stata una modifica rispetto al suggerimento originale)
    const hasChanged = 
      result.classification?.category_id !== catId ||
      result.classification?.subject_id !== subId ||
      result.classification?.detail_id !== detId;
    
    if (hasChanged && result.originalTransaction) {
      try {
        await fetch('/api/prima-nota/classification-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            db,
            transactionId: result.originalTransaction.id,
            originalDescription: result.originalTransaction.description,
            amount: result.originalTransaction.amount,
            transactionDate: result.originalTransaction.date,
            suggestedCategoryId: result.classification?.category_id,
            suggestedSubjectId: result.classification?.subject_id,
            suggestedDetailId: result.classification?.detail_id,
            suggestionConfidence: result.classification?.confidence,
            suggestionMethod: result.classification?.method,
            correctedCategoryId: catId,
            correctedSubjectId: subId,
            correctedDetailId: detId,
          }),
        });
      } catch (feedbackError) {
        console.warn('⚠️ Could not save correction feedback:', feedbackError);
      }
    }
  };

  // Funzioni per aprire i dialog di creazione
  const handleOpenNewCategoryDialog = () => {
    setNewCategoryName('');
    setOpenNewCategoryDialog(true);
  };

  const handleOpenNewSubjectDialog = () => {
    if (!selectedCategory) {
      enqueueSnackbar('Seleziona prima una categoria', { variant: 'warning' });
      return;
    }
    setNewSubjectName('');
    setOpenNewSubjectDialog(true);
  };

  const handleOpenNewDetailDialog = () => {
    if (!selectedSubject) {
      enqueueSnackbar('Seleziona prima un soggetto', { variant: 'warning' });
      return;
    }
    setNewDetailName('');
    setOpenNewDetailDialog(true);
  };

  // Funzioni per creare nuovi elementi
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      enqueueSnackbar('Inserisci un nome per la categoria', { variant: 'error' });
      return;
    }

    try {
      setCreatingCategory(true);
      const response = await axios.post('/api/category/create', { db, name: newCategoryName.trim() });
      
      if (response.status === 200) {
        // Nota: dovremmo triggerare un re-fetch delle categorie nel parent component
        // Per ora, aggiorniamo manualmente
        enqueueSnackbar(`Categoria "${newCategoryName}" creata con successo - ricarica per vederla nella lista`, { 
          variant: 'success',
          autoHideDuration: 3000
        });
        setOpenNewCategoryDialog(false);
      }
    } catch (error) {
      console.error('Errore durante la creazione della categoria:', error);
      enqueueSnackbar('Errore durante la creazione della categoria', { variant: 'error' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      enqueueSnackbar('Inserisci un nome per il soggetto', { variant: 'error' });
      return;
    }

    if (!selectedCategory) {
      enqueueSnackbar('Seleziona prima una categoria', { variant: 'error' });
      return;
    }

    try {
      setCreatingSubject(true);
      const response = await axios.post('/api/subject/create', {
        db,
        name: newSubjectName.trim(),
        categoryId: selectedCategory
      });
      
      if (response.status === 200) {
        // Ricarica i soggetti
        const subjectResponse = await axios.post(endpoints.subject.list, { db, categoryId: selectedCategory });
        if (subjectResponse.status === 200) {
          const subjects = subjectResponse.data.data.sort((a, b) => a.name.localeCompare(b.name));
          setSubjectsList(subjects);
          
          const newSubject = subjects.find(subj => subj.name === newSubjectName.trim());
          if (newSubject) {
            setSelectedSubject(newSubject.id);
            setSelectedDetail(null);
            setDetailsList([]);
            
            // Carica i dettagli per il nuovo soggetto
            await fetchDetails(newSubject.id);
            updateParent(selectedCategory, newSubject.id, null);
            
            enqueueSnackbar(`Soggetto "${newSubjectName}" creato con successo`, { 
              variant: 'success',
              autoHideDuration: 2000
            });
          }
        }
        setOpenNewSubjectDialog(false);
      }
    } catch (error) {
      console.error('Errore durante la creazione del soggetto:', error);
      enqueueSnackbar('Errore durante la creazione del soggetto', { variant: 'error' });
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateDetail = async () => {
    if (!newDetailName.trim()) {
      enqueueSnackbar('Inserisci un nome per il dettaglio', { variant: 'error' });
      return;
    }

    if (!selectedSubject) {
      enqueueSnackbar('Seleziona prima un soggetto', { variant: 'error' });
      return;
    }

    try {
      setCreatingDetail(true);
      const response = await axios.post('/api/detail/create', {
        db,
        name: newDetailName.trim(),
        subjectId: selectedSubject
      });
      
      if (response.status === 200) {
        // Ricarica i dettagli
        const detailResponse = await axios.post(endpoints.detail.list, { db, subjectId: selectedSubject });
        if (detailResponse.status === 200) {
          const details = detailResponse.data.data.sort((a, b) => a.name.localeCompare(b.name));
          setDetailsList(details);
          
          const newDetail = details.find(detail => detail.name === newDetailName.trim());
          if (newDetail) {
            setSelectedDetail(newDetail.id);
            updateParent(selectedCategory, selectedSubject, newDetail.id);
            enqueueSnackbar(`Dettaglio "${newDetailName}" creato con successo`, { 
              variant: 'success',
              autoHideDuration: 2000
            });
          }
        }
        setOpenNewDetailDialog(false);
      }
    } catch (error) {
      console.error('Errore durante la creazione del dettaglio:', error);
      enqueueSnackbar('Errore durante la creazione del dettaglio', { variant: 'error' });
    } finally {
      setCreatingDetail(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1">
          Modifica Classificazione
        </Typography>
        <Chip 
          label={excluded ? "Esclusa dal salvataggio" : "Inclusa nel salvataggio"}
          color={excluded ? "warning" : "success"}
          size="small"
          variant="soft"
          icon={<Iconify icon={excluded ? "solar:close-circle-bold" : "solar:check-circle-bold"} />}
          onClick={onToggleExclude}
          sx={{ cursor: 'pointer' }}
        />
      </Stack>
      
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
          disabled={excluded}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Categoria"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {!excluded && (
                      <Button 
                        color="primary"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenNewCategoryDialog();
                        }}
                        size="small"
                        title="Crea nuova categoria"
                        sx={{ 
                          minWidth: 'unset', 
                          ml: 1, 
                          px: 0.5,
                          py: 0.5,
                          borderRadius: '50%'
                        }}
                      >
                        <Iconify icon="eva:plus-fill" width={20} height={20} />
                      </Button>
                    )}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          fullWidth
          options={subjectsList || []}
          value={subjectsList?.find((s) => s.id === selectedSubject) || null}
          onChange={(e, v) => handleSubjectChange(v)}
          getOptionLabel={(option) => option.name || ''}
          disabled={!selectedCategory || excluded}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Soggetto"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {selectedCategory && !excluded && (
                      <Button 
                        color="primary"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenNewSubjectDialog();
                        }}
                        disabled={!selectedCategory}
                        size="small"
                        title="Crea nuovo soggetto"
                        sx={{ 
                          minWidth: 'unset', 
                          ml: 1, 
                          px: 0.5,
                          py: 0.5,
                          borderRadius: '50%'
                        }}
                      >
                        <Iconify icon="eva:plus-fill" width={20} height={20} />
                      </Button>
                    )}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          fullWidth
          options={detailsList || []}
          value={detailsList?.find((d) => d.id === selectedDetail) || null}
          onChange={(e, v) => handleDetailChange(v)}
          getOptionLabel={(option) => option.name || ''}
          disabled={!selectedSubject || excluded}
          renderInput={(params) => (
            <TextField 
              {...params} 
              label="Dettaglio (opzionale)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {selectedSubject && !excluded && (
                      <Button 
                        color="primary"
                        variant="outlined"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenNewDetailDialog();
                        }}
                        disabled={!selectedSubject}
                        size="small"
                        title="Crea nuovo dettaglio"
                        sx={{ 
                          minWidth: 'unset', 
                          ml: 1, 
                          px: 0.5,
                          py: 0.5,
                          borderRadius: '50%'
                        }}
                      >
                        <Iconify icon="eva:plus-fill" width={20} height={20} />
                      </Button>
                    )}
                  </>
                ),
              }}
            />
          )}
        />
      </Stack>

      {excluded && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'warning.lighter', borderRadius: 1 }}>
          <Typography variant="caption" color="warning.dark">
            ⚠️ Questa transazione sarà esclusa dal salvataggio automatico
          </Typography>
        </Box>
      )}

      {/* Dialog per creazione nuova categoria */}
      <Dialog 
        open={openNewCategoryDialog} 
        onClose={() => setOpenNewCategoryDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuova Categoria</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Categoria"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingCategory) {
                e.preventDefault();
                handleCreateCategory();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewCategoryDialog(false)} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateCategory}
            loading={creatingCategory}
            variant="contained"
            color="primary"
          >
            Crea Categoria
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog per creazione nuovo soggetto */}
      <Dialog 
        open={openNewSubjectDialog} 
        onClose={() => setOpenNewSubjectDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuovo Soggetto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Soggetto"
            type="text"
            fullWidth
            variant="outlined"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingSubject) {
                e.preventDefault();
                handleCreateSubject();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewSubjectDialog(false)} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateSubject}
            loading={creatingSubject}
            variant="contained"
            color="primary"
          >
            Crea Soggetto
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog per creazione nuovo dettaglio */}
      <Dialog 
        open={openNewDetailDialog} 
        onClose={() => setOpenNewDetailDialog(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuovo Dettaglio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Dettaglio"
            type="text"
            fullWidth
            variant="outlined"
            value={newDetailName}
            onChange={(e) => setNewDetailName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingDetail) {
                e.preventDefault();
                handleCreateDetail();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDetailDialog(false)} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateDetail}
            loading={creatingDetail}
            variant="contained"
            color="primary"
          >
            Crea Dettaglio
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

EditForm.propTypes = {
  result: PropTypes.object,
  categories: PropTypes.array,
  onSave: PropTypes.func,
  db: PropTypes.string,
  excluded: PropTypes.bool,
  onToggleExclude: PropTypes.func,
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
  const [excludedIds, setExcludedIds] = useState(new Set());

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
    setExcludedIds(new Set());
  };

  const handleClose = () => {
    setDialogOpen(false);
    setResults([]);
    setProgress(0);
    setSelectedResultId(null);
    setExcludedIds(new Set());
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

  const handleToggleExclude = (resultId) => {
    setExcludedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleApplyAll = async () => {
    setLoading(true);

    try {
      // Applica solo le classificazioni riuscite e non escluse
      const successfulResults = results.filter((r) => r.success && !excludedIds.has(r.id));

      // Salva tutte le transazioni e i feedback in parallelo
      await Promise.all(
        successfulResults.map(async (result) => {
          const t = result.originalTransaction;
          
          // Salva la transazione
          await fetch('/api/prima-nota/edit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: t.id,
              owner: t.ownerid,
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

          // Salva il feedback per learning (non bloccare se fallisce)
          try {
            await fetch('/api/prima-nota/classification-feedback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                db: settings.db,
                transactionId: t.id,
                originalDescription: t.description,
                amount: t.amount,
                transactionDate: t.date,
                suggestedCategoryId: result.classification.category_id,
                suggestedSubjectId: result.classification.subject_id,
                suggestedDetailId: result.classification.detail_id,
                suggestionConfidence: result.classification.confidence,
                suggestionMethod: result.classification.method,
                correctedCategoryId: result.classification.category_id,
                correctedSubjectId: result.classification.subject_id,
                correctedDetailId: result.classification.detail_id,
              }),
            });
          } catch (feedbackError) {
            console.warn('⚠️ Could not save learning feedback for transaction:', t.id, feedbackError);
          }
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
  const includedCount = results.filter((r) => r.success && !excludedIds.has(r.id)).length;
  const excludedCount = excludedIds.size;
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
            <Grid container sx={{ flex: 1, height: '100%' }}>
              {/* Colonna Sinistra: Lista */}
              <Grid 
                item 
                xs={12} 
                md={4} 
                sx={{ 
                  borderRight: '1px solid', 
                  borderColor: 'divider', 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%',
                  maxHeight: '100%'
                }}
              >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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
                    {excludedCount > 0 && (
                      <Chip 
                        label={`${excludedCount} Escluse`}
                        color="warning"
                        size="small"
                        variant="soft"
                      />
                    )}
                  </Stack>
                </Box>
                <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                  {results.map((result) => {
                    const isExcluded = excludedIds.has(result.id);
                    return (
                    <Box
                      key={result.id}
                      onClick={() => setSelectedResultId(result.id)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selectedResultId === result.id ? 'action.selected' : 'transparent',
                        opacity: isExcluded ? 0.5 : 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s, opacity 0.2s',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        {isExcluded && (
                          <Iconify
                            icon="solar:close-circle-bold"
                            color="warning.main"
                            width={20}
                            sx={{ mt: 0.5, flexShrink: 0 }}
                          />
                        )}
                        {!isExcluded && (
                          <Iconify
                            icon={result.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                            color={result.success ? 'success.main' : 'error.main'}
                            width={20}
                            sx={{ mt: 0.5, flexShrink: 0 }}
                          />
                        )}
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {result.description}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {fCurrencyEur(result.amount)}
                          </Typography>
                          {result.success && !isExcluded && (
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="primary.main" noWrap sx={{ fontWeight: 'bold' }}>
                                {result.classification.category_name} &gt; {result.classification.subject_name}
                              </Typography>
                              <Chip size="small" label="Suggerito" color="secondary" variant="soft" sx={{ height: 16, fontSize: '0.65rem' }} />
                            </Stack>
                          )}
                          {isExcluded && (
                            <Typography variant="caption" color="warning.main" noWrap sx={{ fontStyle: 'italic' }}>
                              Esclusa dal salvataggio
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  );
                  })}
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
                    excluded={excludedIds.has(selectedResult.id)}
                    onToggleExclude={() => handleToggleExclude(selectedResult.id)}
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

          {results.length > 0 && includedCount > 0 && (
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleApplyAll}
              loading={loading}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Salva {includedCount} {includedCount === 1 ? 'transazione' : 'transazioni'}
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
