import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

// ----------------------------------------------------------------------

const DOCUMENT_TYPE_CONFIG = {
  fattura: {
    label: 'Fattura',
    color: 'primary',
  },
  contratto: {
    label: 'Contratto',
    color: 'secondary',
  },
  bilancio: {
    label: 'Bilancio',
    color: 'success',
  },
  dichiarazione_fiscale: {
    label: 'Dichiarazione Fiscale',
    color: 'warning',
  },
  comunicazione: {
    label: 'Comunicazione',
    color: 'info',
  },
  ricevuta: {
    label: 'Ricevuta',
    color: 'default',
  },
  altro: {
    label: 'Altro',
    color: 'default',
  },
};

// ----------------------------------------------------------------------

export default function DocumentTypeChip({ type, subtype, ...other }) {
  const config = DOCUMENT_TYPE_CONFIG[type] || {
    label: type || 'Non Specificato',
    color: 'default',
  };

  return (
    <Stack direction="row" spacing={0.5}>
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        variant="soft"
        {...other}
      />
      {subtype && (
        <Chip
          label={subtype}
          size="small"
          variant="outlined"
          sx={{ textTransform: 'capitalize' }}
        />
      )}
    </Stack>
  );
}

DocumentTypeChip.propTypes = {
  type: PropTypes.string,
  subtype: PropTypes.string,
};
