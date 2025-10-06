import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { it } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import Label from '../../components/label';
import Iconify from '../../components/iconify';
import { useBoolean } from '../../hooks/use-boolean';
import { ConfirmDialog } from '../../components/custom-dialog';
import CustomPopover, { usePopover } from '../../components/custom-popover';

// ----------------------------------------------------------------------

export default function ScadenziarioTableRow({
  row,
  selected,
  onViewRow,
  onEditRow,
  onSelectRow,
  onDeleteRow,
}) {
  const { id, subject, date, description, causale, amount, paymentDate, status } = row;

  const confirm = useBoolean();

  const popover = usePopover();

  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'error';
      case 'upcoming':
        return 'warning';
      case 'future':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (statusValue) => {
    switch (statusValue) {
      case 'completed':
        return 'Pagato';
      case 'overdue':
        return 'Scaduto';
      case 'upcoming':
        return 'In scadenza';
      case 'future':
        return 'Da pagare';
      default:
        return statusValue;
    }
  };

  // Funzione sicura per ottenere il colore del bordo senza rischiare errori undefined
  const getBorderColor = (theme) => {
    const statusColor = getStatusColor(status);
    // Verifica se il colore esiste nel palette del tema
    if (statusColor === 'default' || !theme.palette[statusColor]) {
      return theme.palette.divider; // Fallback sicuro
    }
    return theme.palette[statusColor].main;
  };

  return (
    <>
      <TableRow 
        hover 
        selected={selected}
        sx={{
          transition: 'all 0.2s',
          borderLeft: (theme) => `4px solid ${getBorderColor(theme)}`,
          ...(status === 'overdue' && {
            backgroundColor: (theme) => alpha(theme.palette.error.lighter, 0.12),
          }),
          ...(status === 'upcoming' && {
            backgroundColor: (theme) => alpha(theme.palette.warning.lighter, 0.12),
          }),
          '&:hover': {
            boxShadow: (theme) => theme.customShadows.z8,
            backgroundColor: (theme) => alpha(theme.palette.primary.lighter, 0.12),
            transform: 'translateY(-1px)',
          },
        }}
      >
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography variant="body2" noWrap fontWeight="bold">
            {subject}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {description}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {causale}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify 
              icon="eva:calendar-fill" 
              sx={{ color: 'text.disabled', mr: 1, width: 16, height: 16 }} 
            />
            <Typography variant="body2">
              {date ? format(new Date(date), 'dd MMM yyyy', { locale: it }) : '-'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell align="right">
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontWeight: 'bold', 
              color: parseFloat(amount) > 1000 ? 'error.main' : 'text.primary' 
            }}
          >
            {amount ? parseFloat(amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : '€ 0,00'}
          </Typography>
        </TableCell>

        <TableCell>
          {paymentDate ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify 
                icon="eva:checkmark-circle-fill" 
                sx={{ color: 'success.main', mr: 1, width: 16, height: 16 }} 
              />
              <Typography variant="body2">
                {format(new Date(paymentDate), 'dd MMM yyyy', { locale: it })}
              </Typography>
            </Box>
          ) : (
            '-'
          )}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={getStatusColor(status)}
            startIcon={
              status === 'completed' ? 
                <Iconify icon="eva:checkmark-circle-fill" /> : 
              status === 'overdue' ?
                <Iconify icon="eva:alert-triangle-fill" /> :
              status === 'upcoming' ?
                <Iconify icon="eva:clock-fill" /> :
                <Iconify icon="eva:calendar-outline" />
            }
            sx={{
              textTransform: 'capitalize',
              '& .MuiChip-label': { fontWeight: 'bold' }
            }}
          >
            {getStatusLabel(status)}
          </Label>
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              size="small" 
              color="primary" 
              onClick={onViewRow}
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16) },
              }}
            >
              <Iconify icon="eva:eye-fill" width={18} height={18} />
            </IconButton>
            
            <IconButton 
              size="small" 
              color="info" 
              onClick={onEditRow}
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.info.main, 0.16) },
              }}
            >
              <Iconify icon="eva:edit-fill" width={18} height={18} />
            </IconButton>
            
            <IconButton 
              size="small" 
              color="error" 
              onClick={confirm.onTrue}
              sx={{ 
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.16) },
              }}
            >
              <Iconify icon="eva:trash-2-fill" width={18} height={18} />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140, display: 'none' }} // Nascondiamo il popover dato che ora abbiamo i pulsanti diretti
      >
        <MenuItem
          onClick={() => {
            onViewRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          Visualizza
        </MenuItem>

        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Modifica
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Elimina
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina"
        content="Sei sicuro di voler eliminare questo elemento?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

ScadenziarioTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  onViewRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
};
