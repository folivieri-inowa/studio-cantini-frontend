'use client';

import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function DocumentTableFiltersResult({
  filters,
  onFilters,
  //
  onResetFilters,
  //
  results,
  ...other
}) {
  const handleRemoveStatus = useCallback(
    (inputValue) => {
      const newValue = filters.status.filter((item) => item !== inputValue);
      onFilters('status', newValue);
    },
    [filters.status, onFilters]
  );

  const handleRemovePriority = useCallback(
    (inputValue) => {
      const newValue = filters.priority.filter((item) => item !== inputValue);
      onFilters('priority', newValue);
    },
    [filters.priority, onFilters]
  );

  const handleRemoveDocumentType = useCallback(
    (inputValue) => {
      const newValue = filters.documentType.filter((item) => item !== inputValue);
      onFilters('documentType', newValue);
    },
    [filters.documentType, onFilters]
  );

  const STATUS_LABELS = {
    pending: 'In Attesa',
    ocr_in_progress: 'OCR in Corso',
    cleaning_in_progress: 'Pulizia in Corso',
    embedding_in_progress: 'Embedding in Corso',
    completed: 'Completato',
    failed: 'Fallito',
  };

  const PRIORITY_LABELS = {
    URGENT: 'Urgente',
    HIGH: 'Alta',
    NORMAL: 'Normale',
    LOW: 'Bassa',
    BATCH: 'Batch',
  };

  const DOCUMENT_TYPE_LABELS = {
    fattura: 'Fattura',
    contratto: 'Contratto',
    bilancio: 'Bilancio',
    dichiarazione_fiscale: 'Dichiarazione Fiscale',
    comunicazione: 'Comunicazione',
    ricevuta: 'Ricevuta',
    altro: 'Altro',
  };

  return (
    <Stack spacing={1.5} {...other}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          risultati trovati
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.status.length && (
          <Block label="Stato:">
            {filters.status.map((item) => (
              <Chip
                key={item}
                label={STATUS_LABELS[item]}
                size="small"
                onDelete={() => handleRemoveStatus(item)}
              />
            ))}
          </Block>
        )}

        {!!filters.priority.length && (
          <Block label="Priorità:">
            {filters.priority.map((item) => (
              <Chip
                key={item}
                label={PRIORITY_LABELS[item]}
                size="small"
                onDelete={() => handleRemovePriority(item)}
              />
            ))}
          </Block>
        )}

        {!!filters.documentType.length && (
          <Block label="Tipo:">
            {filters.documentType.map((item) => (
              <Chip
                key={item}
                label={DOCUMENT_TYPE_LABELS[item]}
                size="small"
                onDelete={() => handleRemoveDocumentType(item)}
              />
            ))}
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Rimuovi Filtri
        </Button>
      </Stack>
    </Stack>
  );
}

DocumentTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
};

// ----------------------------------------------------------------------

function Block({ label, children, sx, ...other }) {
  return (
    <Stack
      component={Paper}
      variant="outlined"
      spacing={1}
      direction="row"
      sx={{
        p: 1,
        borderRadius: 1,
        overflow: 'hidden',
        borderStyle: 'dashed',
        ...sx,
      }}
      {...other}
    >
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {label}
      </Box>

      <Stack spacing={1} direction="row" flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

Block.propTypes = {
  children: PropTypes.node,
  label: PropTypes.string,
  sx: PropTypes.object,
};
