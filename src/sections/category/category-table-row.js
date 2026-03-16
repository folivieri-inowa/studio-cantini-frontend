import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import CategoryQuickEditForm from './category-quick-edit-form';
import SubjectNewEditForm from './subjects/subject-new-edit-form';

// ----------------------------------------------------------------------

export default function CategoryTableRow({ row, selected, onDeleteRow, onEditRow, handleUpdate, db }) {
  const { name, subjects } = row;
  const { enqueueSnackbar } = useSnackbar();

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
        currentDb={db}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        onUpdate={async (data) => {
          try {
            const payload = {
              id: data.id || row.id || row._id,
              name: data.name,
              db: db || data.db || row.db,
            };

            await axios.post('/api/category/edit', payload);
            enqueueSnackbar('Categoria aggiornata con successo', { variant: 'success' });
            if (handleUpdate) {
              handleUpdate();
            }
          } catch (error) {
            console.error('Errore durante l\'aggiornamento della categoria:', error);
            enqueueSnackbar('Errore durante l\'aggiornamento della categoria', { variant: 'error' });
          }
        }}
      />

      <SubjectNewEditForm
        rowId={row.id || row._id}
        open={quickCreate.value}
        onClose={quickCreate.onFalse}
        onUpdate={() => {
          // Dopo aver aggiunto un nuovo soggetto, aggiorniamo la lista
          console.log('Aggiunto nuovo soggetto, aggiorniamo la lista');
          if (handleUpdate) {
            handleUpdate(); // Questo è refetchCategories
          }
        }}
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
  handleUpdate: PropTypes.func,
  db: PropTypes.string,
};
