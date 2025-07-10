'use client';

import PropTypes from 'prop-types';

import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ----------------------------------------------------------------------

export default function GroupAggregationModal({ 
  open, 
  onClose, 
  aggregationData, 
  selection = [], 
  categories = [], 
  db 
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6">
          Analisi Aggregata - Test
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Componente modal funzionante - {selection.length} selezioni
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

GroupAggregationModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  aggregationData: PropTypes.object,
  selection: PropTypes.array,
  categories: PropTypes.array,
  db: PropTypes.string,
};
