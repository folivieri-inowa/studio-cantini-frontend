'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------

export default function ScadenziarioInstallmentPreview({ installments, onChange }) {
  const handleAmountChange = (index, value) => {
    const updated = [...installments];
    updated[index] = { ...updated[index], amount: parseFloat(value) || 0 };
    onChange(updated);
  };

  const total = installments.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        Anteprima rate —{' '}
        <Typography component="span" variant="subtitle1" color="primary.main">
          {installments.length} scadenze
        </Typography>
        {' '}che verranno create
      </Typography>

      <Box
        sx={{
          borderRadius: 1.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.2),
                '& .MuiTableCell-root': { fontWeight: 'bold' },
              }}
            >
              <TableCell width={40}>#</TableCell>
              <TableCell>Descrizione</TableCell>
              <TableCell>Data</TableCell>
              <TableCell align="right">Importo €</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {installments.map((inst, i) => (
              <TableRow
                key={i}
                sx={{
                  '&:last-child td': { borderBottom: 0 },
                  '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.08),
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {i + 1}
                  </Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{inst.subject}</Typography>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">
                    {format(new Date(inst.date), 'dd MMM yyyy', { locale: it })}
                  </Typography>
                </TableCell>

                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={inst.amount}
                    onChange={(e) => handleAmountChange(i, e.target.value)}
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{ width: 110 }}
                  />
                </TableCell>
              </TableRow>
            ))}

            {/* Totale */}
            <TableRow
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.12),
                '& .MuiTableCell-root': { borderTop: (theme) => `1px solid ${theme.palette.divider}` },
              }}
            >
              <TableCell colSpan={3}>
                <Typography variant="subtitle2">Totale</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" color="primary.main">
                  {total.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
