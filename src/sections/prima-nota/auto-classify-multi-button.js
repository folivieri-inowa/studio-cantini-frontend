'use client';

import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

// ----------------------------------------------------------------------

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

  const settings = useSettingsContext();

  // Filtra le transazioni selezionate
  const selectedTransactions = transactions?.filter((t) => selectedIds.includes(t.id)) || [];

  const handleStartClassification = () => {
    setDialogOpen(true);
    setResults([]);
    setProgress(0);
    setError(null);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setResults([]);
    setProgress(0);
  };

  const handleClassify = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

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
              success: true,
              classification: result.classification,
            });
          } else {
            classificationResults.push({
              id: transaction.id,
              description: transaction.description,
              success: false,
              error: result.error || 'Classificazione fallita',
            });
          }
        } catch (err) {
          classificationResults.push({
            id: transaction.id,
            description: transaction.description,
            success: false,
            error: err.message,
          });
        }

        setProgress(((i + 1) / totalCount) * 100);
        setResults([...classificationResults]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAll = async () => {
    setLoading(true);

    try {
      // Applica tutte le classificazioni riuscite
      const successfulResults = results.filter((r) => r.success);

      // Uso Promise.all con map invece di for-of
      await Promise.all(
        successfulResults.map((result) =>
          fetch('/api/prima-nota/edit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: result.id,
              categoryId: result.classification.category_id,
              subjectId: result.classification.subject_id,
              detailId: result.classification.detail_id,
              status: 'completed',
              db: settings.db,
            }),
          })
        )
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:magic-stick-3-bold" color="secondary.main" width={24} />
            <span>Auto-classificazione multipla</span>
            <Chip label="BETA" size="small" color="secondary" variant="outlined" />
          </Stack>
        </DialogTitle>

        <DialogContent>
          {/* Info iniziale */}
          {!loading && results.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Iconify 
                icon="solar:magic-stick-3-bold-duotone" 
                width={64} 
                sx={{ color: 'secondary.main', mb: 2 }} 
              />
              <Typography variant="h6" gutterBottom>
                Classifica {selectedTransactions.length} transazioni
              </Typography>
              <Typography variant="body2" color="text.secondary">
                L&apos;AI analizzerà le transazioni selezionate e proporrà una classificazione
                basata su transazioni simili già classificate.
              </Typography>
            </Box>
          )}

          {/* Progress bar durante la classificazione */}
          {loading && results.length < selectedTransactions.length && (
            <Box sx={{ py: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <CircularProgress size={24} color="secondary" />
                <Typography variant="body1">
                  Classificazione in corso... ({results.length}/{selectedTransactions.length})
                </Typography>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                color="secondary"
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          )}

          {/* Risultati */}
          {results.length > 0 && results.length === selectedTransactions.length && (
            <Box>
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <Chip 
                  icon={<Iconify icon="solar:check-circle-bold" />}
                  label={`${successCount} classificate`}
                  color="success"
                  variant="soft"
                />
                {failCount > 0 && (
                  <Chip 
                    icon={<Iconify icon="solar:close-circle-bold" />}
                    label={`${failCount} non classificate`}
                    color="error"
                    variant="soft"
                  />
                )}
              </Stack>

              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {results.map((result) => (
                  <Box
                    key={result.id}
                    sx={{
                      p: 2,
                      mb: 1,
                      borderRadius: 1,
                      bgcolor: result.success ? 'success.lighter' : 'error.lighter',
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Iconify
                        icon={result.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
                        color={result.success ? 'success.main' : 'error.main'}
                        width={20}
                        sx={{ mt: 0.5 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {result.description}
                        </Typography>
                        {result.success && result.classification && (
                          <Typography variant="caption" color="text.secondary">
                            → {result.classification.category_name} / {result.classification.subject_name}
                            {result.classification.confidence && ` (${result.classification.confidence.toFixed(1)}%)`}
                          </Typography>
                        )}
                        {!result.success && (
                          <Typography variant="caption" color="error.main">
                            {result.error}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              Errore: {error}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" onClick={handleClose}>
            Chiudi
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
              Applica {successCount} classificazioni
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
