'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { useSnackbar } from 'notistack';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import AutoClassifySuggestionDialog from './auto-classify-suggestion-dialog';

// ----------------------------------------------------------------------

export default function AutoClassifyButton({ transaction, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();

  // Funzione helper per salvare classificazione (usata da auto-accept e dialog)
  const saveClassification = async (classification, originalSuggestion) => {
    console.log('🔵 Saving classification:', {
      id: transaction.id,
      category: classification.category_id,
      subject: classification.subject_id,
      details: classification.detail_id || '',
      status: 'completed',
      db: settings.db,
    });

    const response = await fetch('/api/prima-nota/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: transaction.id,
        owner: transaction.ownerid,
        date: transaction.date,
        amount: transaction.amount,
        description: transaction.description,
        paymentType: transaction.paymentType || '',
        note: transaction.note || '',
        category: classification.category_id,
        subject: classification.subject_id,
        details: classification.detail_id || '',
        status: 'completed',
        db: settings.db,
        documents: transaction.documents || [],
        excludedFromStats: transaction.excludedFromStats || false,
      }),
    });

    const result = await response.json();
    console.log('🟢 Save response:', result);

    if (!response.ok) {
      throw new Error(result.error || 'Errore nel salvataggio');
    }

    // Salva il feedback per il sistema di learning
    try {
      await fetch('/api/prima-nota/classification-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db: settings.db,
          transactionId: transaction.id,
          originalDescription: transaction.description,
          amount: transaction.amount,
          transactionDate: transaction.date,
          suggestedCategoryId: originalSuggestion?.category_id,
          suggestedSubjectId: originalSuggestion?.subject_id,
          suggestedDetailId: originalSuggestion?.detail_id,
          suggestionConfidence: originalSuggestion?.confidence,
          suggestionMethod: originalSuggestion?.method,
          correctedCategoryId: classification.category_id,
          correctedSubjectId: classification.subject_id,
          correctedDetailId: classification.detail_id,
          wasModified: (
            originalSuggestion?.category_id !== classification.category_id ||
            originalSuggestion?.subject_id !== classification.subject_id ||
            originalSuggestion?.detail_id !== classification.detail_id
          ),
        }),
      });
      console.log('📊 Learning feedback saved successfully');
    } catch (feedbackError) {
      console.warn('⚠️ Could not save learning feedback:', feedbackError);
    }

    // Indicizza automaticamente in Qdrant
    try {
      const indexResponse = await fetch('/api/prima-nota/index-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          db: settings.db,
          transactionId: transaction.id,
        }),
      });
      
      const indexResult = await indexResponse.json();
      if (indexResult.success) {
        console.log('🧠 ✅ Transazione indicizzata! Sistema ha appreso.');
      } else if (indexResult.skipped) {
        console.warn('⚠️ Indicizzazione saltata.');
      }
    } catch (indexError) {
      console.warn('⚠️ Could not index transaction:', indexError);
    }

    // Ricarica i dati
    if (onUpdate) {
      console.log('🔄 Calling onUpdate...');
      onUpdate();
    }
  };

  const handleAutoClassify = async () => {
    setLoading(true);
    setError(null);

    try {
      // USA NUOVA API LOCALE (backend classificazione 4-stage)
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
            paymentType: transaction.paymenttype || null,
            ownerId: transaction.ownerid || null,
          },
          db: settings.db,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore nella classificazione');
      }

      console.log('🎯 [Local Classification] Response:', {
        method: result.classification?.method,
        confidence: result.classification?.confidence,
        needs_review: result.needs_review,
        suggestions_count: result.suggestions?.length || 0,
        latency_ms: result.latency_ms,
      });

      // Se needs_review è true, apri il dialog con suggestions (o modalità manuale)
      if (result.needs_review || !result.classification) {
        console.log('📋 Manual review required, opening dialog with suggestions');
        // Imposta suggestion null ma passa le suggestions alternative
        setSuggestion({
          category_id: null,
          category_name: null,
          subject_id: null,
          subject_name: null,
          detail_id: null,
          detail_name: null,
          confidence: 0,
          method: 'manual',
          reasoning: result.reason || 'Nessuna classificazione automatica sufficiente.',
          suggestions: result.suggestions || [], // Passa suggestions alternative
        });
        setDialogOpen(true);
        return;
      }

      console.log('✅ Auto-classification successful:', {
        method: result.classification.method,
        confidence: result.classification.confidence,
        category: result.classification.category_name,
        subject: result.classification.subject_name,
      });

      // Auto-Accept Logic: controlla se dobbiamo salvare automaticamente
      const autoAcceptEnabled = localStorage.getItem('autoAcceptEnabled') === 'true';
      const autoAcceptThreshold = parseInt(localStorage.getItem('autoAcceptThreshold') || '90', 10);
      const confidence = result.classification.confidence || 0;

      if (autoAcceptEnabled && confidence >= autoAcceptThreshold) {
        console.log(`🚀 Auto-Accept triggered! (confidence ${confidence}% >= ${autoAcceptThreshold}%)`);
        
        // Crea oggetto suggestion per salvare feedback
        const autoSuggestion = {
          ...result.classification,
          suggestions: result.suggestions || [],
        };
        
        // Salva direttamente senza aprire dialog
        try {
          await saveClassification({
            category_id: result.classification.category_id,
            subject_id: result.classification.subject_id,
            detail_id: result.classification.detail_id,
          }, autoSuggestion);
          
          // Feedback visivo
          enqueueSnackbar(
            `✅ Auto-classificato: ${result.classification.category_name} › ${result.classification.subject_name} (${confidence}%)`,
            { 
              variant: 'success',
              autoHideDuration: 3000,
            }
          );
          
          setLoading(false);
          return; // Exit early, non aprire dialog
        } catch (err) {
          console.error('❌ Auto-accept save error:', err);
          enqueueSnackbar(`Errore auto-classificazione: ${err.message}`, { variant: 'error' });
          setError(err.message);
          setLoading(false);
          return;
        }
      }

      // Salva il suggerimento principale + alternative e apri il dialog
      setSuggestion({
        ...result.classification,
        suggestions: result.suggestions || [], // Include suggestions alternative
      });
      setDialogOpen(true);
    } catch (err) {
      console.error('❌ [Local Classification] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSuggestion(null);
  };

  const handleAcceptSuggestion = async (classification) => {
    // Usa la funzione helper per salvare
    try {
      await saveClassification(classification, suggestion);
      handleDialogClose();
    } catch (err) {
      console.error('❌ Save classification error:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <IconButton size="small" disabled>
        <CircularProgress size={18} />
      </IconButton>
    );
  }

  return (
    <>
      <Tooltip title={error || 'Classifica automaticamente con AI (Sistema Locale v2.0)'}>
        <IconButton
          size="small"
          onClick={handleAutoClassify}
          sx={{
            color: error ? '#d32f2f' : '#9c27b0', // Viola per AI
            '&:hover': {
              bgcolor: error ? '#ffebee' : '#f3e5f5',
              color: error ? '#c62828' : '#7b1fa2',
            },
          }}
        >
          <Iconify icon="solar:magic-stick-3-bold" width={18} />
        </IconButton>
      </Tooltip>

      <AutoClassifySuggestionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        suggestion={suggestion}
        transaction={transaction}
        onAccept={handleAcceptSuggestion}
        onUpdate={onUpdate}
      />
    </>
  );
}

AutoClassifyButton.propTypes = {
  transaction: PropTypes.object.isRequired,
  onUpdate: PropTypes.func,
};
