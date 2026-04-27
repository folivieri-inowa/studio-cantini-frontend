'use client';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

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

  const handleDeleteConfirm = async () => {
    try {
      await deleteVehicle(row.id);
      enqueueSnackbar('Veicolo eliminato');
      onMutate?.();
    } catch {
      enqueueSnackbar('Errore eliminazione veicolo', { variant: 'error' });
    }
    confirm.onFalse();
  };

  const handleDeleteClick = () => {
    popover.onClose();
    confirm.onTrue();
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

        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Iconify icon="solar:trash-bin-trash-bold" />
          Elimina
        </MenuItem>
      </CustomPopover>

      <Dialog open={confirm.value} onClose={confirm.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>Elimina veicolo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il veicolo <strong>{row.plate}</strong>? L&apos;operazione non è reversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirm.onFalse}>Annulla</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
