import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import CategoryQuickEditForm from './category-quick-edit-form';
import SubjectNewEditForm from './subjects/subject-new-edit-form';

// ----------------------------------------------------------------------

export default function CategoryTableRow({ row, selected, onDeleteRow, onEditRow }) {
  const { name, subjects } = row;

  const confirm = useBoolean();
  const quickEdit = useBoolean();
  const quickCreate = useBoolean();

  const confirmDialogMessage = <Typography variant="body2" color="textSecondary">
    Sei sicuro di voler eliminare questa categoria? <br /> <b>L&#39;operazione non può essere annullata e tutti i soggetti ad essa associati verranno eliminati.</b>
  </Typography>

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{subjects}</TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Modifica" placement="top" arrow>
            <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={quickEdit.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Nuovo soggetto" placement="top" arrow>
            <IconButton color={quickCreate.value ? 'inherit' : 'default'} onClick={quickCreate.onTrue}>
              <Iconify icon="solar:add-square-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Elimina" placement="top" arrow>
            <IconButton color="error.main" onClick={confirm.onTrue}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <CategoryQuickEditForm
        currentCategory={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onUpdate={onEditRow}
      />

      <SubjectNewEditForm
        rowId={row.id}
        open={quickCreate.value}
        onClose={quickCreate.onFalse}
        onUpdate={onEditRow}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina"
        content={confirmDialogMessage}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

CategoryTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
