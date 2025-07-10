'use client';

import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

export default function GroupAggregationModalFinal({ 
  open, 
  onClose, 
  data, 
  loading, 
  error 
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Risultati Aggregazione Categorie
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          {loading && (
            <Typography variant="body2">
              Caricamento dati aggregazione...
            </Typography>
          )}
          
          {error && (
            <Typography variant="body2" color="error">
              Errore: {error}
            </Typography>
          )}
          
          {data && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Statistiche Aggregate
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(data, null, 2)}
              </Typography>
            </Box>
          )}
          
          {!loading && !error && !data && (
            <Typography variant="body2">
              Nessun dato disponibile per l'aggregazione.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GroupAggregationModalFinal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
};
