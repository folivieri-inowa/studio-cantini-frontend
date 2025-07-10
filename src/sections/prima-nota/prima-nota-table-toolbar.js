import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export default function PrimaNotaTableToolbar({
  filters,
  onFilters,
  publishOptions,
  ownersOptions,
  categoriesOptions,
  stateFilter = true,
  onImportOpen,
  onHistoryOpen,
}) {
  const popover = usePopover();

  const handleFilterDescription = useCallback(
    (event) => {
      onFilters('description', event.target.value);
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

  const handleFilterPublish = useCallback(
    (event) => {
      onFilters(
        'status',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterOwner = useCallback(
    (event) => {
      onFilters(
        'owner',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterCategory = useCallback(
    (event) => {
      onFilters(
        'categories',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  return (
    <>
      <Box sx={{ p: 2.5 }}>
        {/* Prima riga con i campi di filtro */}
        <Stack spacing={2} direction="row" alignItems="center" sx={{ mb: 2 }}>
          <DatePicker
            label="Data inizio"
            value={filters.startDate}
            onChange={handleFilterStartDate}
            slotProps={{
              textField: {
                fullWidth: true,
              },
            }}
            sx={{
              maxWidth: { md: '20%' },
            }}
          />

          <DatePicker
            label="Data fine"
            value={filters.endDate}
            onChange={handleFilterEndDate}
            slotProps={{ textField: { fullWidth: true } }}
            sx={{
              maxWidth: { md: '20%' },
            }}
          />

          {stateFilter && (
            <>
              <FormControl
                sx={{
                  flexShrink: 0,
                  width: { xs: 1, md: '20%' },
                }}
              >
                <InputLabel>Stato</InputLabel>

                <Select
                  multiple
                  value={filters.status}
                  onChange={handleFilterPublish}
                  input={<OutlinedInput label="status" />}
                  renderValue={(selected) =>
                    selected
                      .map(
                        (value) => publishOptions.find((option) => option.value === value)?.label
                      )
                      .join(', ')
                  }
                  sx={{ textTransform: 'capitalize' }}
                  variant="standard"
                >
                  {publishOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Checkbox
                        disableRipple
                        size="small"
                        checked={filters.status.includes(option.value)}
                      />
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                sx={{
                  flexShrink: 0,
                  width: { xs: 1, md: '20%' },
                }}
              >
                <InputLabel>Conto corrente</InputLabel>
                <Select
                  multiple
                  value={filters.owner}
                  onChange={handleFilterOwner}
                  input={<OutlinedInput label="owners" />}
                  renderValue={(selected) =>
                    selected
                      .map((id) => ownersOptions.find((option) => option.id === id)?.name)
                      .join(', ')
                  }
                  sx={{ textTransform: 'capitalize' }}
                  variant="standard"
                >
                  {ownersOptions.map((option) => (
                    <MenuItem key={option.name} value={option.id}>
                      <Checkbox
                        disableRipple
                        size="small"
                        checked={filters.owner.includes(option.id)}
                      />
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                sx={{
                  flexShrink: 0,
                  width: { xs: 1, md: '20%' },
                }}
              >
                <InputLabel>Categoria</InputLabel>
                <Select
                  multiple
                  value={filters.categories}
                  onChange={handleFilterCategory}
                  input={<OutlinedInput label="categories" />}
                  renderValue={(selected) =>
                    selected
                      .map((id) => categoriesOptions.find((option) => option.id === id)?.name)
                      .join(', ')
                  }
                  sx={{ textTransform: 'capitalize' }}
                  variant="standard"
                >
                  {categoriesOptions.map((option) => (
                    <MenuItem key={option.name} value={option.id}>
                      <Checkbox
                        disableRipple
                        size="small"
                        checked={filters.categories.includes(option.id)}
                      />
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </Stack>

        {/* Seconda riga con solo il campo di ricerca descrizione */}
        <TextField
          fullWidth
          value={filters.description}
          onChange={handleFilterDescription}
          placeholder="Ricerca in descrizione o importo"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:printer-minimalistic-bold" />
          Print
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:import-bold" />
          Import
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Export
        </MenuItem>
      </CustomPopover>
    </>
  );
}

PrimaNotaTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  publishOptions: PropTypes.array,
  stateFilter: PropTypes.bool,
  ownersOptions: PropTypes.array,
  categoriesOptions: PropTypes.array,
  onImportOpen: PropTypes.func,
  onHistoryOpen: PropTypes.func,
};
