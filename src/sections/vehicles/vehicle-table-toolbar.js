'use client';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'Tutti gli stati' },
  { value: 'attivo', label: 'Attivo' },
  { value: 'fermo', label: 'Fermo' },
  { value: 'in_manutenzione', label: 'In manutenzione' },
  { value: 'venduto', label: 'Venduto' },
  { value: 'radiato', label: 'Radiato' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Tutte le disponibilità' },
  { value: 'aziendale', label: 'Aziendale' },
  { value: 'uso_misto', label: 'Uso misto' },
  { value: 'personale', label: 'Personale' },
];

// ----------------------------------------------------------------------

export default function VehicleTableToolbar({ filters, onFilters, onResetFilters }) {
  const hasActiveFilters =
    filters.search || filters.status || filters.ownerType || filters.availabilityType || filters.assigneeName;

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <TextField
        fullWidth
        value={filters.search}
        onChange={(e) => onFilters('search', e.target.value)}
        placeholder="Cerca per targa, marca, modello, intestatario, assegnatario..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        value={filters.status}
        onChange={(e) => onFilters('status', e.target.value)}
        label="Stato"
        sx={{ minWidth: 160 }}
      >
        {STATUS_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        value={filters.availabilityType}
        onChange={(e) => onFilters('availabilityType', e.target.value)}
        label="Disponibilità"
        sx={{ minWidth: 180 }}
      >
        {AVAILABILITY_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      {hasActiveFilters && (
        <Button
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={onResetFilters}
          sx={{ flexShrink: 0 }}
        >
          Reset
        </Button>
      )}
    </Stack>
  );
}
