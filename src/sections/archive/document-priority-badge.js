import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';

// ----------------------------------------------------------------------

const PRIORITY_CONFIG = {
  URGENT: {
    label: 'Urgente',
    color: 'error',
  },
  HIGH: {
    label: 'Alta',
    color: 'warning',
  },
  NORMAL: {
    label: 'Normale',
    color: 'default',
  },
  LOW: {
    label: 'Bassa',
    color: 'info',
  },
  BATCH: {
    label: 'Batch',
    color: 'default',
  },
};

// ----------------------------------------------------------------------

export default function DocumentPriorityBadge({ priority, ...other }) {
  const config = PRIORITY_CONFIG[priority] || {
    label: priority,
    color: 'default',
  };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      variant="outlined"
      {...other}
    />
  );
}

DocumentPriorityBadge.propTypes = {
  priority: PropTypes.string.isRequired,
};
