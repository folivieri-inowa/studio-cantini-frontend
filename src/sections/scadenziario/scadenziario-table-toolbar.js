import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ScadenziarioTableToolbar({
  filters,
  onFilters,
  statusOptions,
}) {
  const handleFilterSearch = useCallback(
    (event) => {
      onFilters('searchQuery', event.target.value);
    },
    [onFilters]
  );

  const handleFilterStartDate = useCallback(
    (newValue) => {
      onFilters('startDate', newValue);
    },
    [onFilters]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      onFilters('endDate', newValue);
    },
    [onFilters]
  );

  const handleFilterStatus = useCallback(
    (event) => {
      const { value } = event.target;
      onFilters('status', value);
    },
    [onFilters]
  );

  return (
    <Stack
      spacing={2}
      divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'flex-start', md: 'center' }}
      sx={{ py: 2.5, px: 3 }}
    >
      <TextField
        fullWidth
        value={filters.searchQuery || ''}
        onChange={handleFilterSearch}
        placeholder="Cerca in soggetto, descrizione, causale, importo..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ width: 1 }}>
        <DatePicker
          label="Da data"
          value={filters.startDate}
          onChange={handleFilterStartDate}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: 'Da data',
            },
          }}
          format="dd/MM/yyyy"
        />

        <DatePicker
          label="A data"
          value={filters.endDate}
          onChange={handleFilterEndDate}
          slotProps={{
            textField: {
              fullWidth: true,
              placeholder: 'A data',
            },
          }}
          format="dd/MM/yyyy"
        />

        <FormControl fullWidth>
          <InputLabel>Stato</InputLabel>
          <Select
            value={filters.status || []}
            onChange={handleFilterStatus}
            label="Stato"
            multiple
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}

ScadenziarioTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  statusOptions: PropTypes.array,
};
