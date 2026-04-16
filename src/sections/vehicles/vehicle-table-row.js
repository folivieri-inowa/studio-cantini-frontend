'use client';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSnackbar } from 'src/components/snackbar';

import { deleteVehicle } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  attivo: 'success',
  fermo: 'warning',
  in_manutenzione: 'info',
  venduto: 'default',
  radiato: 'error',
};

// ----------------------------------------------------------------------

export default function VehicleTableRow({ row, loading, onViewRow, onMutate }) {
  const popover = usePopover();
  const confirm = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  if (loading) {
    return (
      <TableRow>
        {[...Array(7)].map((_, i) => (
          <TableCell key={i}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteVehicle(row.id);
      enqueueSnackbar('Veicolo eliminato');
      onMutate?.();
    } catch {
      enqueueSnackbar('Errore eliminazione veicolo', { variant: 'error' });
    }
    popover.onClose();
  };

  return (
    <>
      <TableRow hover onClick={onViewRow} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ fontWeight: 600 }}>{row.plate}</TableCell>

        <TableCell>
          {[row.make, row.model].filter(Boolean).join(' ') || '—'}
        </TableCell>

        <TableCell>{row.owner_name || '—'}</TableCell>

        <TableCell>{row.assignee_name || '—'}</TableCell>

        <TableCell>
          <Chip
            size="small"
            label={row.status}
            color={STATUS_COLORS[row.status] || 'default'}
            variant="soft"
          />
        </TableCell>

        <TableCell>{row.availability_type || '—'}</TableCell>

        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
          <IconButton color={popover.open ? 'primary' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 160 }}
      >
        <MenuItem onClick={onViewRow}>
          <Iconify icon="solar:eye-bold" />
          Apri
        </MenuItem>

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Elimina
        </MenuItem>
      </CustomPopover>
    </>
  );
}
