'use client';

import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import LoadingButton from '@mui/lab/LoadingButton';

import { useSnackbar } from 'notistack';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import axios, { endpoints } from '../../utils/axios';
import { useGetCategories } from '../../api/category';
import { fCurrencyEur } from '../../utils/format-number';

// ----------------------------------------------------------------------

export default function AutoClassifySuggestionDialog({
  open,
  onClose,
  suggestion,
  transaction,
  onAccept,
  onUpdate,
}) {
  const settings = useSettingsContext();
  const { db } = settings;
  const { categories } = useGetCategories(db);
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  // Auto-Accept Settings (salva in localStorage)
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(() => {
    const saved = localStorage.getItem('autoAcceptEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [autoAcceptThreshold, setAutoAcceptThreshold] = useState(() => {
    const saved = localStorage.getItem('autoAcceptThreshold');
    return saved ? parseInt(saved, 10) : 90;
  });

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

  // Quando cambia il suggerimento, aggiorna le selezioni E carica soggetti/dettagli
  useEffect(() => {
    const loadSuggestion = async () => {
      if (suggestion && open) {
        console.log('Setting initial selection from suggestion:', suggestion);
        setSelectedCategory(suggestion.category_id || null);
        
        // Carica i soggetti per la categoria suggerita
        if (suggestion.category_id) {
          await fetchSubjects(suggestion.category_id);
          setSelectedSubject(suggestion.subject_id || null);
          
          // Carica i dettagli per il soggetto suggerito dopo aver caricato i soggetti
          if (suggestion.subject_id) {
            await fetchDetails(suggestion.subject_id);
            setSelectedDetail(suggestion.detail_id || null);
          }
        } else {
          setSubjectsList([]);
          setDetailsList([]);
          setSelectedSubject(null);
          setSelectedDetail(null);
        }
      }
    };
    
    loadSuggestion();
  }, [suggestion, open, fetchSubjects, fetchDetails]);

  // Reset quando la categoria cambia manualmente (solo se diversa dal suggerimento)
  useEffect(() => {
    if (selectedCategory && suggestion) {
      // Se la categoria è diversa dal suggerimento, ricarica soggetti e resetta soggetto/dettaglio
      if (selectedCategory !== suggestion.category_id) {
        setSelectedSubject(null);
        setSelectedDetail(null);
        setDetailsList([]);
        fetchSubjects(selectedCategory);
      }
    }
  }, [selectedCategory, suggestion, fetchSubjects]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept({
        category_id: selectedCategory,
        subject_id: selectedSubject,
        detail_id: selectedDetail,
      });
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      // Enter → Accetta (se categoria e soggetto selezionati)
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        if (selectedCategory && selectedSubject && !loading) {
          event.preventDefault();
          handleAccept();
        }
      }
      
      // Esc → Chiudi
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, selectedCategory, selectedSubject, loading, onClose]);

  // Salva preferenze auto-accept in localStorage
  useEffect(() => {
    localStorage.setItem('autoAcceptEnabled', JSON.stringify(autoAcceptEnabled));
  }, [autoAcceptEnabled]);

  useEffect(() => {
    localStorage.setItem('autoAcceptThreshold', autoAcceptThreshold.toString());
  }, [autoAcceptThreshold]);

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
        // Ricarica le categorie
        const categoryResponse = await axios.get(endpoints.category.list, { params: { db } });
        if (categoryResponse.status === 200) {
          const newCategories = categoryResponse.data.data;
          const newCategory = newCategories.find(cat => cat.name === newCategoryName.trim());
          
          if (newCategory) {
            setSelectedCategory(newCategory.id);
            setSelectedSubject(null);
            setSelectedDetail(null);
            setSubjectsList([]);
            setDetailsList([]);
            enqueueSnackbar(`Categoria "${newCategoryName}" creata con successo`, { 
              variant: 'success',
              autoHideDuration: 2000
            });
          }
        }
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

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedSubject(null);
    setSelectedDetail(null);
    setSubjectsList([]);
    setDetailsList([]);
    onClose();
  };

  const confidencePercent = suggestion?.confidence || 0;
  const isHighConfidence = confidencePercent >= 90;
  const isMediumConfidence = confidencePercent >= 70 && confidencePercent < 90;
  const method = suggestion?.method || 'unknown';
  
  // Helper per ottenere info del method
  const getMethodInfo = (methodType) => {
    switch (methodType) {
      case 'rule':
        return { label: 'Regola', color: 'success', icon: 'solar:shield-check-bold' };
      case 'exact':
        return { label: 'Match Esatto', color: 'info', icon: 'solar:check-circle-bold' };
      case 'semantic':
        return { label: 'Ricerca AI', color: 'primary', icon: 'solar:cpu-bold' };
      case 'manual':
        return { label: 'Manuale', color: 'warning', icon: 'solar:hand-stars-line-duotone' };
      default:
        return { label: 'Sconosciuto', color: 'default', icon: 'solar:question-circle-bold' };
    }
  };
  
  const methodInfo = getMethodInfo(method);
  const suggestions = suggestion?.suggestions || [];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:magic-stick-3-bold" color="secondary.main" width={24} />
            <span>Classificazione Automatica AI</span>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip 
              label="v2.0" 
              size="small" 
              color="success" 
              variant="soft"
              sx={{ fontWeight: 'bold' }}
            />
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Info transazione */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            bgcolor: 'background.neutral',
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Transazione
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {transaction?.description}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Importo: {fCurrencyEur(transaction?.amount)}
          </Typography>
        </Box>

        {/* Alert quando non ci sono suggerimenti automatici */}
        {suggestion && suggestion.method === 'manual' && (
          <Alert severity="info" sx={{ mb: 3 }} icon={<Iconify icon="solar:info-circle-bold" width={24} />}>
            <Typography variant="body2">
              {suggestion.reasoning || 'Nessuna transazione simile trovata nel database. Classifica manualmente questa transazione per migliorare il sistema di apprendimento automatico.'}
            </Typography>
          </Alert>
        )}
        {suggestion && suggestion.confidence > 0 && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Metodo di Classificazione
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  size="small"
                  label={methodInfo.label}
                  color={methodInfo.color}
                  icon={<Iconify icon={methodInfo.icon} width={16} />}
                />
                <Chip
                  size="small"
                  label={`${confidencePercent.toFixed(0)}%`}
                  color={isHighConfidence ? 'success' : isMediumConfidence ? 'warning' : 'error'}
                  sx={{ fontWeight: 'bold', minWidth: 65 }}
                />
              </Stack>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={confidencePercent}
              color={isHighConfidence ? 'success' : isMediumConfidence ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 1 }}
            />
            {suggestion.reasoning && (
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
              >
                {suggestion.reasoning}
              </Typography>
            )}
          </Box>
        )}
        
        {/* Suggestions alternative (se presenti) */}
        {suggestions && suggestions.length > 0 && (
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary
              expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
              sx={{
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Iconify icon="solar:lightbulb-bold" width={22} color="info.main" />
                <Typography variant="subtitle2">
                  Suggerimenti Alternativi ({suggestions.length})
                </Typography>
                <Chip 
                  label="Clicca per visualizzare" 
                  size="small" 
                  color="info" 
                  variant="outlined"
                />
              </Stack>
            </AccordionSummary>
            
            <AccordionDetails>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Trovate {suggestions.length} transazioni simili. Clicca su un suggerimento per applicarlo.
              </Typography>
              
              {/* Lista suggerimenti cliccabili */}
              <Stack spacing={1}>
              {suggestions.map((sug, index) => {
                const sugConfidence = Math.round(sug.confidence || 0);
                const isHighConf = sugConfidence >= 90;
                const isMedConf = sugConfidence >= 70 && sugConfidence < 90;
                
                return (
                  <Box
                    key={index}
                    onClick={() => {
                      setSelectedCategory(sug.category_id);
                      setSelectedSubject(sug.subject_id);
                      setSelectedDetail(sug.detail_id || null);
                      fetchSubjects(sug.category_id);
                      if (sug.subject_id) {
                        fetchDetails(sug.subject_id);
                      }
                      enqueueSnackbar(`Suggerimento ${index + 1} applicato`, { variant: 'success' });
                    }}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Stack spacing={1}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Iconify icon="solar:star-bold" width={18} color="warning.main" />
                          <Typography variant="subtitle2">
                            Suggerimento {index + 1}
                          </Typography>
                        </Stack>
                        <Chip 
                          label={`${sugConfidence}%`}
                          size="small"
                          color={isHighConf ? 'success' : isMedConf ? 'warning' : 'error'}
                        />
                      </Stack>
                      
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Categoria:</strong> {sug.category_name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Soggetto:</strong> {sug.subject_name || 'N/A'}
                        </Typography>
                        {sug.detail_name && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Dettaglio:</strong> {sug.detail_name}
                          </Typography>
                        )}
                      </Stack>
                      
                      {sug.reasoning && (
                        <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                          {sug.reasoning}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Selezione categoria */}
        <Autocomplete
          fullWidth
          disablePortal={false}
          options={categories || []}
          value={categories?.find((c) => c.id === selectedCategory) || null}
          onChange={(event, newValue) => {
            setSelectedCategory(newValue?.id || null);
            if (newValue?.id !== suggestion?.category_id) {
              setSelectedSubject(null);
              setSelectedDetail(null);
            }
          }}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <span>{option.name}</span>
                {suggestion?.category_id === option.id && (
                  <Chip size="small" label="Suggerito" color="primary" variant="soft" />
                )}
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Categoria *"
              placeholder="Seleziona una categoria"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
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
                  </>
                ),
              }}
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Selezione soggetto */}
        <Autocomplete
          fullWidth
          disablePortal={false}
          options={subjectsList || []}
          value={subjectsList?.find((s) => s.id === selectedSubject) || null}
          onChange={(event, newValue) => {
            const newSubjectId = newValue?.id || null;
            setSelectedSubject(newSubjectId);
            setSelectedDetail(null);
            
            // Carica i dettagli per il nuovo soggetto
            if (newSubjectId) {
              fetchDetails(newSubjectId);
            } else {
              setDetailsList([]);
            }
          }}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={!selectedCategory || subjectsList.length === 0}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <span>{option.name}</span>
                {suggestion?.subject_id === option.id && (
                  <Chip size="small" label="Suggerito" color="primary" variant="soft" />
                )}
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Soggetto *"
              placeholder="Seleziona un soggetto"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {selectedCategory && (
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
          sx={{ mb: 2 }}
        />

        {/* Selezione dettaglio */}
        <Autocomplete
          fullWidth
          disablePortal={false}
          options={detailsList || []}
          value={detailsList?.find((d) => d.id === selectedDetail) || null}
          onChange={(event, newValue) => {
            setSelectedDetail(newValue?.id || null);
          }}
          getOptionLabel={(option) => option.name || ''}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          disabled={!selectedSubject}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                <span>{option.name}</span>
                {suggestion?.detail_id === option.id && (
                  <Chip size="small" label="Suggerito" color="primary" variant="soft" />
                )}
              </Stack>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Dettaglio (opzionale)"
              placeholder="Seleziona un dettaglio"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {params.InputProps.endAdornment}
                    {selectedSubject && (
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

        {/* Nota sul metodo */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {method === 'rag_direct'
            ? '✓ Classificazione basata su transazioni simili già classificate'
            : '⚡ Classificazione analizzata da intelligenza artificiale'}
        </Typography>
      </DialogContent>

      {/* Auto-Accept Settings */}
      <Box sx={{ px: 3, py: 2, bgcolor: 'background.neutral', borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="solar:settings-bold" width={20} color="text.secondary" />
              <Typography variant="subtitle2" color="text.secondary">
                Impostazioni Rapide
              </Typography>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={autoAcceptEnabled}
                  onChange={(e) => setAutoAcceptEnabled(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  Auto-accetta {autoAcceptEnabled && `≥${autoAcceptThreshold}%`}
                </Typography>
              }
            />
          </Stack>
          
          {autoAcceptEnabled && (
            <Box sx={{ px: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>
                  Confidence minima:
                </Typography>
                <Slider
                  value={autoAcceptThreshold}
                  onChange={(e, value) => setAutoAcceptThreshold(value)}
                  min={70}
                  max={100}
                  step={5}
                  marks={[
                    { value: 70, label: '70%' },
                    { value: 85, label: '85%' },
                    { value: 100, label: '100%' }
                  ]}
                  valueLabelDisplay="auto"
                  size="small"
                />
              </Stack>
              <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" width={16} />} sx={{ mt: 1, py: 0.5 }}>
                <Typography variant="caption">
                  I suggerimenti con confidence ≥ {autoAcceptThreshold}% verranno salvati automaticamente senza mostrare questo dialog.
                </Typography>
              </Alert>
            </Box>
          )}
          
          {/* Keyboard Shortcuts Info */}
          <Box sx={{ pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Stack direction="row" spacing={3} sx={{ opacity: 0.7 }}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip label="Enter" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                <Typography variant="caption" color="text.secondary">Accetta</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Chip label="Esc" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                <Typography variant="caption" color="text.secondary">Chiudi</Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </Box>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Annulla
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          onClick={handleAccept}
          loading={loading}
          disabled={!selectedCategory || !selectedSubject}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Accetta classificazione
        </LoadingButton>
      </DialogActions>

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
    </Dialog>
  );
}

AutoClassifySuggestionDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  suggestion: PropTypes.object,
  transaction: PropTypes.object,
  onAccept: PropTypes.func,
  onUpdate: PropTypes.func,
};
