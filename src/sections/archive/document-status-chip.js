import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const STATUS_CONFIG = {
  pending: {
    label: 'In Attesa',
    color: 'warning',
  },
  ocr_in_progress: {
    label: 'OCR in Corso',
    color: 'info',
  },
  ocr_completed: {
    label: 'OCR Completato',
    color: 'info',
  },
  cleaning_in_progress: {
    label: 'Pulizia in Corso',
    color: 'info',
  },
  cleaning_completed: {
    label: 'Pulizia Completata',
    color: 'info',
  },
  embedding_in_progress: {
    label: 'Embedding in Corso',
    color: 'info',
  },
  embedding_completed: {
    label: 'Embedding Completato',
    color: 'info',
  },
  completed: {
    label: 'Completato',
    color: 'success',
  },
  failed: {
    label: 'Fallito',
    color: 'error',
  },
};

// ----------------------------------------------------------------------

export default function DocumentStatusChip({ status, ...other }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'default',
  };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="soft"
      {...other}
    />
  );
}

DocumentStatusChip.propTypes = {
  status: PropTypes.string.isRequired,
};
