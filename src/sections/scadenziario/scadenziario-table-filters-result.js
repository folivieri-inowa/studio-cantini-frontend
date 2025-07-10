import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { it } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ScadenziarioTableFiltersResult({
  filters,
  onFilters,
  onResetFilters,
  results,
  statusOptions,
}) {
  const handleRemoveSearch = () => {
    onFilters('searchQuery', '');
  };

  const handleRemoveAllRange = () => {
    onFilters('startDate', null);
    onFilters('endDate', null);
  };

  const handleRemoveStatus = (inputValue) => {
    const newValue = filters.status.filter((item) => item !== inputValue);
    onFilters('status', newValue);
  };

  return (
    <Stack spacing={1.5} sx={{ p: 3 }}>
      <Box sx={{ typography: 'body2' }}>
        <strong>{results}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          risultati trovati
        </Box>
      </Box>

      <Stack flexGrow={1} spacing={1} direction="row" flexWrap="wrap" alignItems="center">
        {!!filters.searchQuery && (
          <Block label="Ricerca:">
            <Chip
              size="small"
              label={filters.searchQuery}
              onDelete={handleRemoveSearch}
            />
          </Block>
        )}

        {(filters.startDate || filters.endDate) && (
          <Block label="Data:">
            <Chip
              size="small"
              label={`${filters.startDate ? format(new Date(filters.startDate), 'dd MMM yyyy', { locale: it }) : ''} ~ ${
                filters.endDate ? format(new Date(filters.endDate), 'dd MMM yyyy', { locale: it }) : ''
              }`}
              onDelete={handleRemoveAllRange}
            />
          </Block>
        )}

        {!!filters.status.length && (
          <Block label="Stato:">
            <Stack direction="row" flexWrap="wrap" spacing={1}>
              {filters.status.map((item) => {
                const option = statusOptions.find((status) => status.value === item);
                return (
                  <Chip
                    key={item}
                    size="small"
                    label={option?.label || item}
                    onDelete={() => handleRemoveStatus(item)}
                  />
                );
              })}
            </Stack>
          </Block>
        )}

        <Button
          color="error"
          onClick={onResetFilters}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Cancella
        </Button>
      </Stack>
    </Stack>
  );
}

ScadenziarioTableFiltersResult.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  onResetFilters: PropTypes.func,
  results: PropTypes.number,
  statusOptions: PropTypes.array,
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
