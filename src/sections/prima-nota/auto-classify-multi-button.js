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
import SearchSimilarButton from './search-similar-button';

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
    
    // Salva il feedback per learning (sempre, sia per correzioni che conferme)
    if (result.originalTransaction) {
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
            wasModified: (
              result.classification?.category_id !== catId ||
              result.classification?.subject_id !== subId ||
              result.classification?.detail_id !== detId
            ),
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

      {/* Banner per needs_review */}
      {result.success && result.needs_review && !result.classification && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1, border: '1px solid', borderColor: 'warning.main' }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Iconify icon="solar:danger-triangle-bold" color="warning.main" width={24} sx={{ mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                Revisione Manuale Richiesta
              </Typography>
              <Typography variant="body2" color="warning.dark">
                {result.reason || 'Nessuna classificazione automatica sufficientemente affidabile. Seleziona manualmente categoria e soggetto.'}
              </Typography>
              {result.suggestions && result.suggestions.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="warning.dark" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                    {result.suggestions.length} {result.suggestions.length === 1 ? 'Suggerimento disponibile' : 'Suggerimenti disponibili'}:
                  </Typography>
                  <Stack spacing={0.5}>
                    {result.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <Box 
                        key={idx}
                        sx={{ 
                          p: 1, 
                          bgcolor: 'background.paper', 
                          borderRadius: 0.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                        onClick={() => {
                          // Applica il suggestion
                          const cat = categories.find(c => c.id === suggestion.category_id);
                          if (cat) {
                            handleCategoryChange(cat);
                            // Dopo il fetch dei subjects, imposta subject
                            setTimeout(() => {
                              const subj = subjectsList.find(s => s.id === suggestion.subject_id);
                              if (subj) handleSubjectChange(subj);
                            }, 100);
                          }
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" fontWeight="bold" sx={{ flex: 1 }}>
                            {suggestion.category_name} › {suggestion.subject_name}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={`${Math.round(suggestion.confidence || 0)}%`}
                            color={suggestion.confidence >= 70 ? 'warning' : 'default'}
                            variant="soft"
                            sx={{ height: 16, fontSize: '0.6rem' }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      )}

      {/* Banner per classificazione riuscita */}
      {result.success && result.classification && !result.needs_review && (
        <Box sx={{ mb: 3, p: 1.5, bgcolor: 'success.lighter', borderRadius: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Iconify icon="solar:check-circle-bold" color="success.main" width={20} />
            <Typography variant="body2" color="success.dark">
              Classificazione automatica: <strong>{result.classification.category_name} › {result.classification.subject_name}</strong>
              {result.classification.method && ` • ${(() => {
                const m = result.classification.method;
                return m === 'rule' ? '🛡️ Regola' : m === 'exact' ? '✓ Match Esatto' : m === 'semantic' ? '🧠 AI' : '✋ Manuale';
              })()}`}
              {result.classification.confidence > 0 && ` • ${Math.round(result.classification.confidence)}%`}
            </Typography>
          </Stack>
        </Box>
      )}

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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

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
          console.log(`🎯 [Multi-Classify ${i+1}/${totalCount}] Classificazione:`, transaction.id);
          
          // eslint-disable-next-line no-await-in-loop
          const response = await fetch('/api/prima-nota/classify-local', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: {
                id: transaction.id,
                description: transaction.description,
                amount: transaction.amount,
                date: transaction.date,
                paymentType: transaction.paymentType || '',
                ownerId: transaction.ownerid,
              },
              db: settings.db,
            }),
          });

          // eslint-disable-next-line no-await-in-loop
          const result = await response.json();

          console.log(`🎯 [Multi-Classify ${i+1}/${totalCount}] Response:`, {
            success: result.success,
            method: result.classification?.method,
            confidence: result.classification?.confidence,
            needs_review: result.needs_review,
          });

          if (response.ok && result.success) {
            // Distinguiamo tra successo con classification e needs_review
            if (result.classification) {
              // ✅ Classificazione riuscita
              classificationResults.push({
                id: transaction.id,
                description: transaction.description,
                amount: transaction.amount,
                date: transaction.date,
                success: true,
                classification: result.classification,
                suggestions: result.suggestions || [],
                needs_review: result.needs_review || false,
                reason: result.reason,
                originalTransaction: transaction,
              });
            } else {
              // ⚠️ Richiede revisione manuale (NON è un errore!)
              classificationResults.push({
                id: transaction.id,
                description: transaction.description,
                amount: transaction.amount,
                date: transaction.date,
                success: true,
                classification: null,
                suggestions: result.suggestions || [],
                needs_review: true,
                reason: result.reason || 'Richiede revisione manuale',
                originalTransaction: transaction,
              });
            }
          } else {
            // ❌ Errore reale
            classificationResults.push({
              id: transaction.id,
              description: transaction.description,
              amount: transaction.amount,
              date: transaction.date,
              success: false,
              error: result.error || 'Classificazione fallita',
              needs_review: true,
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

  // Escludi tutte le transazioni non classificate (needs_review o errori)
  const handleExcludeUnclassified = () => {
    const unclassifiedIds = results
      .filter(r => !r.success || !r.classification)
      .map(r => r.id);
    
    setExcludedIds(prev => {
      const newSet = new Set(prev);
      unclassifiedIds.forEach(id => newSet.add(id));
      return newSet;
    });
  };

  const handleApplyAll = async () => {
    setLoading(true);

    try {
      // Applica solo le classificazioni riuscite CON classification valida e non escluse
      // NON salva quelle con needs_review (devono essere riviste manualmente)
      const successfulResults = results.filter((r) => r.success && r.classification && !excludedIds.has(r.id));

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
                wasModified: false, // Multi-classify accetta sempre il suggerimento
              }),
            });
          } catch (feedbackError) {
            console.warn('⚠️ Could not save learning feedback for transaction:', t.id, feedbackError);
          }
        })
      );

      // Indicizza tutte le transazioni in batch per apprendimento real-time
      if (successfulResults.length > 0) {
        try {
          const transactionIds = successfulResults.map(r => r.originalTransaction.id);
          
          const batchIndexResponse = await fetch('/api/prima-nota/index-batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              db: settings.db,
              transactionIds,
            }),
          });
          
          const batchResult = await batchIndexResponse.json();
          if (batchResult.success) {
            console.log(
              `🧠 [Multi-Classify] Batch indicizzato ${batchResult.indexed_count}/${transactionIds.length} ` +
              `transazioni in ${batchResult.latency_ms}ms (media: ${batchResult.avg_latency_per_transaction_ms}ms/txn)`
            );
          } else {
            console.warn('⚠️ Batch indexing parzialmente fallito:', batchResult);
          }
        } catch (batchIndexError) {
          console.warn('⚠️ Could not batch index transactions:', batchIndexError);
        }
      }

      // Mostra dialog di scelta: continuare o chiudere?
      setSavedCount(successfulResults.length);
      setConfirmDialogOpen(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
    // Non setLoading(false) qui, viene fatto dopo la scelta dell'utente
  };

  // Dopo salvataggio: continua con le restanti
  const handleContinueWithRemaining = () => {
    // Rimuovi le transazioni salvate dalla lista
    const savedIds = results
      .filter(r => r.success && r.classification && !excludedIds.has(r.id))
      .map(r => r.id);
    
    const remainingResults = results.filter(r => !savedIds.includes(r.id));
    
    setResults(remainingResults);
    setExcludedIds(new Set()); // Reset esclusioni
    setSelectedResultId(remainingResults.length > 0 ? remainingResults[0].id : null);
    setConfirmDialogOpen(false);
    setLoading(false);
  };

  // Dopo salvataggio: chiudi e torna alla lista
  const handleCloseAfterSave = () => {
    if (onUpdate) {
      onUpdate();
    }
    setConfirmDialogOpen(false);
    setLoading(false);
    handleClose();
  };

  const successCount = results.filter((r) => r.success && r.classification).length;
  const reviewCount = results.filter((r) => r.success && !r.classification && r.needs_review).length;
  const failCount = results.filter((r) => !r.success).length;
  const includedCount = results.filter((r) => r.success && r.classification && !excludedIds.has(r.id)).length;
  const excludedCount = excludedIds.size;
  const selectedResult = results.find(r => r.id === selectedResultId);

  return (
    <>
      <Tooltip title="Auto-classifica selezionati con AI (Sistema Locale v2.0)">
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
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" justifyContent="space-between">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {successCount > 0 && (
                        <Chip 
                          label={`${successCount} Classificate`}
                          color="success"
                          size="small"
                          variant="soft"
                          icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                        />
                      )}
                      {reviewCount > 0 && (
                        <Chip 
                          label={`${reviewCount} Da rivedere`}
                          color="warning"
                          size="small"
                          variant="soft"
                          icon={<Iconify icon="solar:danger-triangle-bold" width={16} />}
                        />
                      )}
                      {failCount > 0 && (
                        <Chip 
                          label={`${failCount} Errori`}
                          color="error"
                          size="small"
                          variant="soft"
                          icon={<Iconify icon="solar:close-circle-bold" width={16} />}
                        />
                      )}
                      {excludedCount > 0 && (
                        <Chip 
                          label={`${excludedCount} Escluse`}
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    {(reviewCount > 0 || failCount > 0) && (
                      <Tooltip title="Escludi automaticamente tutte le transazioni non classificate">
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={handleExcludeUnclassified}
                          startIcon={<Iconify icon="solar:close-circle-bold" width={16} />}
                        >
                          Escludi non classificate
                        </Button>
                      </Tooltip>
                    )}
                  </Stack>
                </Box>
                <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
                  {results.map((result) => {
                    const isExcluded = excludedIds.has(result.id);
                    return (
                    <Box
                      key={result.id}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: selectedResultId === result.id ? 'action.selected' : 'transparent',
                        opacity: isExcluded ? 0.5 : 1,
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.2s, opacity 0.2s',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Box 
                          onClick={() => setSelectedResultId(result.id)}
                          sx={{ 
                            p: 2, 
                            cursor: 'pointer',
                            flex: 1,
                            display: 'flex',
                            gap: 1
                          }}
                        >
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
                              icon={
                                result.success && result.classification
                                  ? 'solar:check-circle-bold'
                                  : result.success && result.needs_review
                                  ? 'solar:danger-triangle-bold'
                                  : 'solar:close-circle-bold'
                              }
                              color={
                                result.success && result.classification
                                  ? 'success.main'
                                  : result.success && result.needs_review
                                  ? 'warning.main'
                                  : 'error.main'
                              }
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
                            {result.success && result.classification && !isExcluded && (
                              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                <Typography variant="caption" color="primary.main" noWrap sx={{ fontWeight: 'bold' }}>
                                  {result.classification.category_name} &gt; {result.classification.subject_name}
                                  {result.classification.detail_name && ` > ${result.classification.detail_name}`}
                                </Typography>
                                {result.classification.method && (
                                  <Chip 
                                    size="small" 
                                    label={(() => {
                                      const method = result.classification.method;
                                      if (method === 'rule') return '🛡️ Regola';
                                      if (method === 'exact') return '✓ Esatto';
                                      if (method === 'semantic') return '🧠 AI';
                                      return '✋ Manuale';
                                    })()} 
                                    color={(() => {
                                      const method = result.classification.method;
                                      if (method === 'rule') return 'success';
                                      if (method === 'exact') return 'info';
                                      if (method === 'semantic') return 'secondary';
                                      return 'warning';
                                    })()}
                                    variant="soft" 
                                    sx={{ height: 18, fontSize: '0.65rem' }} 
                                  />
                                )}
                                {result.classification.confidence > 0 && (
                                  <Chip 
                                    size="small" 
                                    label={`${Math.round(result.classification.confidence)}%`}
                                    color={
                                      result.classification.confidence >= 90 ? 'success' : 
                                      result.classification.confidence >= 70 ? 'warning' : 
                                      'error'
                                    }
                                    variant="soft" 
                                    sx={{ height: 18, fontSize: '0.65rem' }} 
                                  />
                                )}
                              </Stack>
                            )}
                            {result.success && result.needs_review && !result.classification && !isExcluded && (
                              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, fontStyle: 'italic', display: 'block' }}>
                                ⚠️ {result.reason || 'Richiede revisione manuale'}
                                {result.suggestions && result.suggestions.length > 0 && ` (${result.suggestions.length} suggerimenti)`}
                              </Typography>
                            )}
                            {!result.success && !isExcluded && (
                              <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                                ❌ {result.error}
                              </Typography>
                            )}
                            {isExcluded && (
                              <Typography variant="caption" color="warning.main" noWrap sx={{ fontStyle: 'italic' }}>
                                Esclusa dal salvataggio
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        {result.originalTransaction && (
                          <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                            <SearchSimilarButton transaction={result.originalTransaction} />
                          </Box>
                        )}
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

      {/* Dialog di conferma dopo salvataggio */}
      <Dialog 
        open={confirmDialogOpen} 
        onClose={() => {}} // Non permettere chiusura con click fuori
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:check-circle-bold" color="success.main" width={28} />
            <span>Salvataggio Completato</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            <strong>{savedCount}</strong> {savedCount === 1 ? 'transazione è stata salvata' : 'transazioni sono state salvate'} con successo!
          </Typography>
          
          {results.filter(r => !r.success || !r.classification || excludedIds.has(r.id)).length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark">
                <strong>
                  {results.filter(r => !r.success || !r.classification || excludedIds.has(r.id)).length}
                </strong> {results.filter(r => !r.success || !r.classification || excludedIds.has(r.id)).length === 1 ? 'transazione rimane' : 'transazioni rimangono'} da classificare.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Vuoi continuare a classificarle manualmente o tornare alla lista principale?
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCloseAfterSave}
            startIcon={<Iconify icon="solar:logout-2-bold" />}
          >
            Torna alla lista
          </Button>
          {results.filter(r => !r.success || !r.classification || excludedIds.has(r.id)).length > 0 && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinueWithRemaining}
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              Continua con le restanti
            </Button>
          )}
          {results.filter(r => !r.success || !r.classification || excludedIds.has(r.id)).length === 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleCloseAfterSave}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              Chiudi
            </Button>
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
