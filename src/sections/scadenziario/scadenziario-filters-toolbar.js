'use client';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'overdue',   label: 'Scaduto' },
  { value: 'upcoming',  label: 'In scadenza' },
  { value: 'future',    label: 'Da pagare' },
  { value: 'completed', label: 'Pagato' },
];

const TYPE_OPTIONS = [
  { value: 'fattura',    label: 'Fattura' },
  { value: 'rata',       label: 'Rata' },
  { value: 'fiscale',    label: 'Fiscale' },
  { value: 'ricorrente', label: 'Ricorrente' },
  { value: 'acconto',    label: 'Acconto' },
  { value: 'saldo',      label: 'Saldo' },
  { value: 'altro',      label: 'Altro' },
];

// ----------------------------------------------------------------------

export default function ScadenziarioFiltersToolbar({ filters, onFiltersChange }) {
  const handleText = useCallback(
    (e) => onFiltersChange({ ...filters, text: e.target.value }),
    [filters, onFiltersChange]
  );

  const handleStatus = useCallback(
    (e) => onFiltersChange({ ...filters, status: e.target.value }),
    [filters, onFiltersChange]
  );

  const handleType = useCallback(
    (e) => onFiltersChange({ ...filters, type: e.target.value }),
    [filters, onFiltersChange]
  );

  const handleDateFrom = useCallback(
    (val) => onFiltersChange({ ...filters, dateFrom: val }),
    [filters, onFiltersChange]
  );

  const handleDateTo = useCallback(
    (val) => onFiltersChange({ ...filters, dateTo: val }),
    [filters, onFiltersChange]
  );

  const handleReset = useCallback(
    () => onFiltersChange({ text: '', status: [], type: [], dateFrom: null, dateTo: null }),
    [onFiltersChange]
  );

  const isFiltered =
    filters.text ||
    filters.status?.length ||
    filters.type?.length ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Cerca soggetto, fornitore, n° fattura…"
            value={filters.text}
            onChange={handleText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          {isFiltered && (
            <IconButton onClick={handleReset} size="small" color="error" title="Rimuovi filtri">
              <Iconify icon="eva:close-circle-fill" />
            </IconButton>
          )}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Stato</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={handleStatus}
              input={<OutlinedInput label="Stato" />}
              renderValue={(selected) =>
                selected.map((v) => STATUS_OPTIONS.find((o) => o.value === v)?.label).join(', ')
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              multiple
              value={filters.type}
              onChange={handleType}
              input={<OutlinedInput label="Tipo" />}
              renderValue={(selected) =>
                selected.map((v) => TYPE_OPTIONS.find((o) => o.value === v)?.label).join(', ')
              }
            >
              {TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            label="Da data"
            value={filters.dateFrom}
            onChange={handleDateFrom}
            slotProps={{ textField: { size: 'small' } }}
          />

          <DatePicker
            label="A data"
            value={filters.dateTo}
            onChange={handleDateTo}
            slotProps={{ textField: { size: 'small' } }}
          />
        </Stack>

        {isFiltered && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {filters.status?.map((v) => (
              <Chip
                key={v}
                size="small"
                label={STATUS_OPTIONS.find((o) => o.value === v)?.label}
                onDelete={() => onFiltersChange({ ...filters, status: filters.status.filter((s) => s !== v) })}
              />
            ))}
            {filters.type?.map((v) => (
              <Chip
                key={v}
                size="small"
                label={TYPE_OPTIONS.find((o) => o.value === v)?.label}
                onDelete={() => onFiltersChange({ ...filters, type: filters.type.filter((t) => t !== v) })}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Card>
  );
}
