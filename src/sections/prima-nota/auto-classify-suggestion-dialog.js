'use client';

import PropTypes from 'prop-types';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import axios, { endpoints } from '../../utils/axios';
import { useGetSubjects } from '../../api/subject';
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
  const { subjects } = useGetSubjects(db);

  const [loading, setLoading] = useState(false);
  const [detailsList, setDetailsList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);

  // Filtra soggetti per categoria selezionata
  const filteredSubjects = useMemo(() => {
    if (!selectedCategory || !subjects) return [];
    return subjects.filter((s) => s.categoryid === selectedCategory);
  }, [selectedCategory, subjects]);

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

  // Quando cambia il suggerimento, aggiorna le selezioni
  useEffect(() => {
    if (suggestion && open) {
      setSelectedCategory(suggestion.category_id || null);
      setSelectedSubject(suggestion.subject_id || null);
      setSelectedDetail(suggestion.detail_id || null);
      
      // Carica i dettagli per il soggetto suggerito
      if (suggestion.subject_id) {
        fetchDetails(suggestion.subject_id);
      }
    }
  }, [suggestion, open, fetchDetails]);

  // Reset quando la categoria cambia
  useEffect(() => {
    if (selectedCategory && suggestion) {
      // Se la categoria è diversa dal suggerimento, resetta soggetto e dettaglio
      if (selectedCategory !== suggestion.category_id) {
        setSelectedSubject(null);
        setSelectedDetail(null);
        setDetailsList([]);
      }
    }
  }, [selectedCategory, suggestion]);

  // Carica dettagli quando il soggetto cambia
  useEffect(() => {
    if (selectedSubject && suggestion) {
      if (selectedSubject !== suggestion.subject_id) {
        setSelectedDetail(null);
        fetchDetails(selectedSubject);
      }
    }
  }, [selectedSubject, suggestion, fetchDetails]);

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
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Categoria</InputLabel>
          <Select
            value={selectedCategory || ''}
            label="Categoria"
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories?.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
                {suggestion?.category_id === cat.id && (
                  <Chip size="small" label="Suggerito" color="primary" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selezione soggetto */}
        <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedCategory}>
          <InputLabel>Soggetto</InputLabel>
          <Select
            value={selectedSubject || ''}
            label="Soggetto"
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {filteredSubjects?.map((subj) => (
              <MenuItem key={subj.id} value={subj.id}>
                {subj.name}
                {suggestion?.subject_id === subj.id && (
                  <Chip size="small" label="Suggerito" color="primary" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Selezione dettaglio */}
        <FormControl fullWidth disabled={!selectedSubject}>
          <InputLabel>Dettaglio (opzionale)</InputLabel>
          <Select
            value={selectedDetail || ''}
            label="Dettaglio (opzionale)"
            onChange={(e) => setSelectedDetail(e.target.value)}
          >
            <MenuItem value="">
              <em>Nessun dettaglio</em>
            </MenuItem>
            {detailsList?.map((det) => (
              <MenuItem key={det.id} value={det.id}>
                {det.name}
                {suggestion?.detail_id === det.id && (
                  <Chip size="small" label="Suggerito" color="primary" sx={{ ml: 1 }} />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
