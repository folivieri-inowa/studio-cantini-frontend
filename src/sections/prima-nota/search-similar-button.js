import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Card,
  Chip,
  Stack,
  Dialog,
  Button,
  Divider,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { useSettingsContext } from 'src/components/settings';
import Iconify from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

export default function SearchSimilarButton({ transaction }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState(null);

  const settings = useSettingsContext();

  const handleSearch = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setSimilar([]);

    try {
      const response = await fetch('/api/prima-nota/search-similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: transaction.description,
          transactionId: transaction.id,
          db: settings.db,
          limit: 10,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore nella ricerca');
      }

      setSimilar(result.data.similar || []);
    } catch (err) {
      console.error('Search similar error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSimilar([]);
    setError(null);
  };

  return (
    <>
      <IconButton
        size="small"
        color="primary"
        onClick={handleSearch}
        title="Cerca transazioni simili"
      >
        <Iconify icon="eva:search-fill" width={20} />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:search-fill" width={24} />
              <Typography variant="h6">Transazioni Simili</Typography>
            </Stack>
            <IconButton onClick={handleClose}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Ricerca per:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {transaction.description}
            </Typography>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {!loading && !error && similar.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Iconify
                icon="eva:inbox-outline"
                width={48}
                sx={{ color: 'text.disabled', mb: 2 }}
              />
              <Typography color="text.secondary">
                Nessuna transazione simile trovata
              </Typography>
            </Box>
          )}

          {!loading && similar.length > 0 && (
            <Stack spacing={2}>
              {similar.map((item) => (
                <Card key={item.id} sx={{ p: 2 }}>
                  <Stack spacing={1.5}>
                    {/* Header con similarity score */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Chip
                        size="small"
                        label={`${item.similarity}% simile`}
                        color={item.similarity >= 80 ? 'success' : item.similarity >= 60 ? 'warning' : 'default'}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {fDate(item.date)}
                      </Typography>
                    </Stack>

                    {/* Descrizione */}
                    <Typography variant="body2">
                      {item.description}
                    </Typography>

                    {/* Importo e Owner */}
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography
                        variant="subtitle2"
                        sx={{ 
                          color: item.amount > 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {fCurrency(item.amount)}
                      </Typography>
                      {item.ownerName && (
                        <Chip
                          size="small"
                          label={item.ownerName}
                          variant="soft"
                        />
                      )}
                    </Stack>

                    {/* Classificazione */}
                    {(item.categoryName || item.subjectName) && (
                      <>
                        <Divider />
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          {item.categoryName && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Iconify icon="eva:folder-fill" width={16} sx={{ color: 'primary.main' }} />
                              <Typography variant="caption">{item.categoryName}</Typography>
                            </Stack>
                          )}
                          {item.subjectName && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Iconify icon="eva:person-fill" width={16} sx={{ color: 'info.main' }} />
                              <Typography variant="caption">{item.subjectName}</Typography>
                            </Stack>
                          )}
                          {item.detailName && (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Iconify icon="eva:file-text-fill" width={16} sx={{ color: 'warning.main' }} />
                              <Typography variant="caption">{item.detailName}</Typography>
                            </Stack>
                          )}
                        </Stack>
                      </>
                    )}

                    {/* Note */}
                    {item.note && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        📝 {item.note}
                      </Typography>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={handleClose}>
              Chiudi
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

SearchSimilarButton.propTypes = {
  transaction: PropTypes.shape({
    description: PropTypes.string.isRequired,
  }).isRequired,
};
