'use client';

import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import LoadingButton from '@mui/lab/LoadingButton';

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

  const [loading, setLoading] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  // Quando cambia il suggerimento, aggiorna le selezioni E carica soggetti/dettagli
  useEffect(() => {
    if (suggestion && open) {
      console.log('Setting initial selection from suggestion:', suggestion);
      setSelectedCategory(suggestion.category_id || null);
      setSelectedSubject(suggestion.subject_id || null);
      setSelectedDetail(suggestion.detail_id || null);
      
      // Carica i soggetti per la categoria suggerita
      if (suggestion.category_id) {
        fetchSubjects(suggestion.category_id).then(() => {
          // Carica i dettagli per il soggetto suggerito dopo aver caricato i soggetti
          if (suggestion.subject_id) {
            fetchDetails(suggestion.subject_id);
          }
        });
      } else {
        setSubjectsList([]);
        setDetailsList([]);
      }
    }
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

  const handleClose = () => {
    setSelectedCategory(null);
    setSelectedSubject(null);
    setSelectedDetail(null);
    setSubjectsList([]);
    setDetailsList([]);
    onClose();
  };

  const confidencePercent = suggestion?.confidence || 0;
  const isHighConfidence = confidencePercent >= 85;
  const method = suggestion?.method || 'unknown';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:magic-stick-3-bold" color="secondary.main" width={24} />
          <span>Proposta di Classificazione AI</span>
          <Chip 
            label="BETA" 
            size="small" 
            color="secondary" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
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

        {/* Confidenza */}
        {suggestion && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Confidenza
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  size="small"
                  label={method === 'rag_direct' ? 'Match diretto' : 'Analisi AI'}
                  color={method === 'rag_direct' ? 'success' : 'info'}
                  icon={
                    <Iconify
                      icon={method === 'rag_direct' ? 'solar:check-circle-bold' : 'solar:cpu-bold'}
                      width={16}
                    />
                  }
                />
                <Typography variant="body2" fontWeight="bold" color={isHighConfidence ? 'success.main' : 'warning.main'}>
                  {confidencePercent.toFixed(1)}%
                </Typography>
              </Stack>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={confidencePercent}
              color={isHighConfidence ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        )}

        {/* Selezione categoria */}
        <Autocomplete
          fullWidth
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
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Selezione soggetto */}
        <Autocomplete
          fullWidth
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
            />
          )}
          sx={{ mb: 2 }}
        />

        {/* Selezione dettaglio */}
        <Autocomplete
          fullWidth
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
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
