'use client';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CashFlowTableRow({ row, onView }) {
  const { withdrawal_date, owner_name, amount, total_spent, remaining_balance, status } = row;

  const statusLabel = status === 'open' ? 'Aperto' : 'Chiuso';
  const statusColor = status === 'open' ? 'warning' : 'success';
  const amountFmt = `€ ${parseFloat(amount || 0).toFixed(2).replace('.', ',')}`;
  const spentFmt = `€ ${parseFloat(total_spent || 0).toFixed(2).replace('.', ',')}`;
  const remainingFmt = `€ ${parseFloat(remaining_balance || 0).toFixed(2).replace('.', ',')}`;

  return (
    <TableRow hover onClick={() => onView?.(row.id)} sx={{ cursor: 'pointer' }}>
      <TableCell>{withdrawal_date}</TableCell>
      <TableCell>{owner_name || '-'}</TableCell>
      <TableCell align="right">{amountFmt}</TableCell>
      <TableCell align="right">{spentFmt}</TableCell>
      <TableCell align="right">{remainingFmt}</TableCell>
      <TableCell>
        <Chip label={statusLabel} color={statusColor} size="small" variant="soft" />
      </TableCell>
      <TableCell align="right">
        <IconButton onClick={(e) => { e.stopPropagation(); onView?.(row.id); }} size="small">
          <Iconify icon="solar:eye-outline" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
