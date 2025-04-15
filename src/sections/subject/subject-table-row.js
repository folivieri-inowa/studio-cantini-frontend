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

import DetailNewEditForm from '../category/details/detail-new-edit-form';
import SubjectQuickEditForm from '../category/subjects/subject-quick-edit-form';

// ----------------------------------------------------------------------

export default function SubjectTableRow({ row, selected, onEditRow, onDeleteRow, onUpdate }) {
  const { name, details } = row;

  const confirm = useBoolean();
  const quickEdit = useBoolean();
  const quickCreate = useBoolean();

  return (
    <>
      <TableRow hover selected={selected}>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{name}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{details}</TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Modifica rapida" placement="top" arrow>
            <IconButton color={quickEdit.value ? 'inherit' : 'default'} onClick={quickEdit.onTrue}>
              <Iconify icon="solar:pen-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Nuovo dettaglio" placement="top" arrow>
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

      <SubjectQuickEditForm
        currentSubject={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onUpdate={onEditRow}
      />

      <DetailNewEditForm
        rowId={row.id}
        open={quickCreate.value}
        onClose={quickCreate.onFalse}
        onUpdate={onUpdate}
      />

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Confermi di voler eliminare questo soggetto?"
        content={
          <>
            Il soggetto: <Typography component="span" fontWeight="bold">{name}</Typography> verrà eliminato. Questa azione non può essere annullata.<br />
            <b>Tutti i dettagli ad esso associati verranno eliminati</b>
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

SubjectTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onUpdate: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
