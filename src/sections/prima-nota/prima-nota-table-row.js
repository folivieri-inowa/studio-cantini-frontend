import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSettingsContext } from 'src/components/settings';
import { useGetOwners } from '../../api/owner';

import { fCurrencyEur } from '../../utils/format-number';
import PrimaNotaSplitForm from './prima-nota-split-form';
import PrimaNotaQuickEditForm from './prima-nota-quick-edit-form';

// ----------------------------------------------------------------------

export default function PrimaNotaTableRow({
  row,
  selected,
  onDeleteRow,
  onUpdate,
  onSelectRow,
  onImportData,
  selectColumns = true,
  editable = true,
  showStatus = true
}) {
  const {
    date,
    description,
    amount,
    ownername,
    ownerid,
    status,
  } = row;

  const settings = useSettingsContext();
  const { owners } = useGetOwners(settings.db);

  const popover = usePopover();
  const splitPopover = usePopover();
  const deletePopover = usePopover();
  const editPopover = usePopover();

  // Mappa di colori fissi per ciascun owner basata sull'indice
  // Questo garantisce che ogni owner abbia un colore diverso e che resti costante
  const ownerColorMap = useMemo(() => {
    const colors = [
      'primary',   // Blu
      'secondary', // Viola
      'error',     // Rosso
      'warning',   // Arancione
      'success',   // Verde
      'info'       // Azzurro
    ];
    
    const colorMap = {};
    
    // Se abbiamo gli owners dal backend, assegniamo i colori in modo sistematico
    if (owners && owners.length) {
      owners.forEach((owner, index) => {
        // Assegna un colore dall'array colors basato sull'indice dell'owner
        // Questo garantisce che ogni owner abbia un colore diverso
        colorMap[owner.id] = colors[index % colors.length];
      });
    }
    
    return colorMap;
  }, [owners]);

  const getStatusColor = (prop) => {
    switch (prop) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'toCheck':
        return 'error';
      default:
        return 'info';
    }
  }

  const getOwnerColor = (ownerId) => {
    return ownerColorMap[ownerId] || 'info';
  }

  const getStatusLabel = (prop) => {
    switch (prop) {
      case 'pending':
        return 'In revisione';
      case 'completed':
        return 'Completata';
      case 'toCheck':
        return 'Da controllare';
      default:
        return 'info';
    }
  }

  return (
    <>
      <TableRow hover selected={selected}>
        {selectColumns && <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>}

         <TableCell>
          <ListItemText primary={format(new Date(date), 'dd MMM yyyy')} />
        </TableCell>

        <TableCell>
          <ListItemText primary={description} />
        </TableCell>

        <TableCell>
          <Label variant="soft" color={getOwnerColor(ownerid)}>
            {ownername}
          </Label>
        </TableCell>

        <TableCell>{fCurrencyEur(amount)}</TableCell>

        {showStatus && (
          <TableCell>
            <Label variant="soft" color={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Label>
          </TableCell>
        )}

        {editable && (
          <TableCell align="right">
            <Stack direction="row" spacing={1}>
              <TableCell align="right">
                <IconButton color={popover.open ? 'primary' : 'default'} onClick={popover.onOpen}>
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              </TableCell>
            </Stack>
          </TableCell>
        )}
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ p: 1 }}
      >
        <MenuItem
          onClick={(target) => {
            editPopover.onOpen(target)
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" /> Modifica
        </MenuItem>

        <MenuItem
          onClick={(target) => {
            splitPopover.onOpen(target);
            popover.onClose();
          }}
        >
          <Iconify icon="solar:slash-square-linear" /> Scorpora
        </MenuItem>

        <MenuItem
          onClick={() => {
            popover.onClose();
            onImportData()
          }}
        >
          <Iconify icon="solar:cloud-upload-linear" /> Importa da file
        </MenuItem>

        <MenuItem
          onClick={(target) => {
            deletePopover.onOpen(target)
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" /> Elimina
        </MenuItem>
      </CustomPopover>

      <PrimaNotaSplitForm
        open={splitPopover.open}
        onClose={splitPopover.onClose}
        transaction={row}
        onUpdate={onUpdate}
      />

      <PrimaNotaQuickEditForm
        open={editPopover.open}
        onClose={editPopover.onClose}
        transaction={row}
        onUpdate={onUpdate}
      />

      <ConfirmDialog
        open={deletePopover.open}
        onClose={deletePopover.onClose}
        title="Elimina riga"
        content="Sei sicuro di voler eliminare la riga selezionata?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

PrimaNotaTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  onUpdate: PropTypes.func,
  onSelectRow: PropTypes.func,
  selectColumns: PropTypes.bool,
  editable: PropTypes.bool,
  showStatus: PropTypes.bool,
  onImportData: PropTypes.func,
};
