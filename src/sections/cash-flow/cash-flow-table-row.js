'use client';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CashFlowTableRow({ row, onView, onEdit, onDelete }) {
  const { withdrawal_date, owner_name, amount, total_spent, remaining_balance, status } = row;

  const isOpen = status === 'open';
  const statusLabel = isOpen ? 'Aperto' : 'Chiuso';
  const statusColor = isOpen ? 'warning' : 'success';
  const amountFmt = `€ ${parseFloat(amount || 0).toFixed(2).replace('.', ',')}`;
  const spentFmt = `€ ${parseFloat(total_spent || 0).toFixed(2).replace('.', ',')}`;
  const remainingFmt = `€ ${parseFloat(remaining_balance || 0).toFixed(2).replace('.', ',')}`;

  return (
    <TableRow hover>
      <TableCell>{withdrawal_date}</TableCell>
      <TableCell>{owner_name || '-'}</TableCell>
      <TableCell align="right">{amountFmt}</TableCell>
      <TableCell align="right">{spentFmt}</TableCell>
      <TableCell align="right">{remainingFmt}</TableCell>
      <TableCell>
        <Chip label={statusLabel} color={statusColor} size="small" variant="soft" />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <IconButton onClick={(e) => { e.stopPropagation(); onView?.(row.id); }} size="small" title="Dettaglio">
            <Iconify icon="solar:eye-outline" width={18} />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onEdit?.(row.id); }}
            size="small"
            title="Modifica"
            disabled={!isOpen}
            sx={{ opacity: isOpen ? 1 : 0.3 }}
          >
            <Iconify icon="solar:pen-outline" width={16} />
          </IconButton>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onDelete?.(row.id); }}
            size="small"
            color="error"
            title="Elimina"
            disabled={!isOpen}
            sx={{ opacity: isOpen ? 1 : 0.3 }}
          >
            <Iconify icon="solar:trash-bin-trash-outline" width={16} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
