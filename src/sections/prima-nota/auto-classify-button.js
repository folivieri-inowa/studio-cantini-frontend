'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

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

  const handleAutoClassify = async () => {
    setLoading(true);
    setError(null);

    try {
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore nella classificazione');
      }

      if (!result.classification) {
        console.error('Response without classification:', result);
        throw new Error('Nessuna classificazione ricevuta dal server');
      }

      console.log('Classification received:', result.classification);

      // Salva il suggerimento e apri il dialog
      setSuggestion(result.classification);
      setDialogOpen(true);
    } catch (err) {
      console.error('Auto-classify error:', err);
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
    // Aggiorna la transazione con la classificazione accettata
    try {
      const response = await fetch('/api/prima-nota/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: transaction.id,
          categoryId: classification.category_id,
          subjectId: classification.subject_id,
          detailId: classification.detail_id,
          status: 'completed',
          db: settings.db,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nel salvataggio');
      }

      // Ricarica i dati
      if (onUpdate) {
        onUpdate();
      }

      handleDialogClose();
    } catch (err) {
      console.error('Save classification error:', err);
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
      <Tooltip title={error || 'Auto-classifica con AI (Beta)'}>
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
