import { useMemo } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useSettingsContext } from 'src/components/settings';
import CustomPopover, { usePopover } from 'src/components/custom-popover';

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
  onToggleStatsExclusion,
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
    excluded_from_stats,
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

  const getOwnerColor = (ownerId) => ownerColorMap[ownerId] || 'info'

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

        <TableCell align="right">{fCurrencyEur(amount)}</TableCell>

        {showStatus && (
          <TableCell>
            <Label variant="soft" color={getStatusColor(status)}>
              {getStatusLabel(status)}
            </Label>
          </TableCell>
        )}

        <TableCell align="center">
          {editable ? (
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Tooltip title="Modifica rapida">
                <IconButton
                  size="small"
                  onClick={(target) => {
                    editPopover.onOpen(target);
                  }}
                  sx={{ 
                    color: '#1976d2', // Blu Material-UI
                    '&:hover': {
                      bgcolor: '#e3f2fd', // Blu chiaro
                      color: '#1565c0'    // Blu scuro al hover
                    }
                  }}
                >
                  <Iconify icon="solar:pen-bold" width={18} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title={excluded_from_stats ? 'Escluso dalle statistiche - Clicca per includere' : 'Incluso nelle statistiche - Clicca per escludere'}>
                <IconButton
                  size="small"
                  onClick={() => onToggleStatsExclusion && onToggleStatsExclusion(row.id, excluded_from_stats)}
                  color={excluded_from_stats ? 'warning' : 'success'}
                >
                  <Iconify 
                    icon={excluded_from_stats ? 'solar:eye-closed-bold' : 'solar:eye-bold'} 
                    width={18}
                  />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            // Modalità consultazione: mostra solo un trattino o spazio vuoto
            <span>-</span>
          )}
        </TableCell>

        {editable && (
          <TableCell align="right">
            <IconButton color={popover.open ? 'primary' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
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
  onToggleStatsExclusion: PropTypes.func,
};
