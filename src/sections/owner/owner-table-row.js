import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import OwnerQuickEditForm from './owner-quick-edit-form';

// ----------------------------------------------------------------------

export default function OwnerTableRow({ row, selected, onDeleteRow, handleUpdate }) {
  const { name, cc, iban, initialBalance, balanceDate, isCreditCard } = row;

  const confirm = useBoolean();
  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <div>{name}</div>
          </Stack>
        </TableCell>

        <TableCell>{cc}</TableCell>

        <TableCell>{iban}</TableCell>
        
        <TableCell>{initialBalance ? `€ ${initialBalance.toLocaleString()}` : '-'}</TableCell>
        
        <TableCell>{balanceDate ? new Date(balanceDate).toLocaleDateString() : '-'}</TableCell>
        
        <TableCell>{isCreditCard ? 'Si' : 'No'}</TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Modifica rapida" placement="top" arrow>
            <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={quickEdit.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Elimina" placement="top" arrow>
            <IconButton color={confirm.value ? 'inherit' : 'default'} onClick={confirm.onTrue}>
              <Iconify icon="solar:trash-bin-minimalistic-bold" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <OwnerQuickEditForm
        currentOwner={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina"
        content="Sei sicuro di voler eliminare questo record?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

OwnerTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  handleUpdate: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
