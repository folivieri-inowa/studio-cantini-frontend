'use client';

import PropTypes from 'prop-types';
import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Attesa' },
  { value: 'ocr_in_progress', label: 'OCR in Corso' },
  { value: 'cleaning_in_progress', label: 'Pulizia in Corso' },
  { value: 'embedding_in_progress', label: 'Embedding in Corso' },
  { value: 'completed', label: 'Completato' },
  { value: 'failed', label: 'Fallito' },
];

const PRIORITY_OPTIONS = [
  { value: 'URGENT', label: 'Urgente' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'NORMAL', label: 'Normale' },
  { value: 'LOW', label: 'Bassa' },
  { value: 'BATCH', label: 'Batch' },
];

const DOCUMENT_TYPE_OPTIONS = [
  { value: 'fattura', label: 'Fattura' },
  { value: 'contratto', label: 'Contratto' },
  { value: 'bilancio', label: 'Bilancio' },
  { value: 'dichiarazione_fiscale', label: 'Dichiarazione Fiscale' },
  { value: 'comunicazione', label: 'Comunicazione' },
  { value: 'ricevuta', label: 'Ricevuta' },
  { value: 'altro', label: 'Altro' },
];

// ----------------------------------------------------------------------

export default function DocumentTableToolbar({ filters, onFilters, canReset, onResetFilters }) {
  const popover = usePopover();

  const handleFilterName = useCallback(
    (event) => {
      onFilters('name', event.target.value);
    },
    [onFilters]
  );

  const handleFilterStatus = useCallback(
    (event) => {
      onFilters(
        'status',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterPriority = useCallback(
    (event) => {
      onFilters(
        'priority',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  const handleFilterDocumentType = useCallback(
    (event) => {
      onFilters(
        'documentType',
        typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value
      );
    },
    [onFilters]
  );

  return (
    <>
      <Stack
        spacing={2}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        direction={{
          xs: 'column',
          md: 'row',
        }}
        sx={{
          p: 2.5,
          pr: { xs: 2.5, md: 1 },
        }}
      >
        <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Stato</InputLabel>

          <Select
            multiple
            value={filters.status}
            onChange={handleFilterStatus}
            input={<OutlinedInput label="Stato" />}
            renderValue={(selected) =>
              selected
                .map((value) => STATUS_OPTIONS.find((option) => option.value === value)?.label)
                .join(', ')
            }
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 240 },
              },
            }}
          >
            {STATUS_OPTIONS.map((option) => (
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
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Priorità</InputLabel>

          <Select
            multiple
            value={filters.priority}
            onChange={handleFilterPriority}
            input={<OutlinedInput label="Priorità" />}
            renderValue={(selected) =>
              selected
                .map((value) => PRIORITY_OPTIONS.find((option) => option.value === value)?.label)
                .join(', ')
            }
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 240 },
              },
            }}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.priority.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          sx={{
            flexShrink: 0,
            width: { xs: 1, md: 200 },
          }}
        >
          <InputLabel>Tipo Documento</InputLabel>

          <Select
            multiple
            value={filters.documentType}
            onChange={handleFilterDocumentType}
            input={<OutlinedInput label="Tipo Documento" />}
            renderValue={(selected) =>
              selected
                .map(
                  (value) => DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label
                )
                .join(', ')
            }
            MenuProps={{
              PaperProps: {
                sx: { maxHeight: 240 },
              },
            }}
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox
                  disableRipple
                  size="small"
                  checked={filters.documentType.includes(option.value)}
                />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
          <TextField
            fullWidth
            value={filters.name}
            onChange={handleFilterName}
            placeholder="Cerca documento..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>

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
          Stampa
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:import-bold" />
          Importa
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
          }}
        >
          <Iconify icon="solar:export-bold" />
          Esporta
        </MenuItem>
      </CustomPopover>
    </>
  );
}

DocumentTableToolbar.propTypes = {
  filters: PropTypes.object,
  onFilters: PropTypes.func,
  canReset: PropTypes.bool,
  onResetFilters: PropTypes.func,
};
