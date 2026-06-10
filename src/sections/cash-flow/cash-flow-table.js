'use client';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import { useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';

import { CashFlowTableRow } from './cash-flow-table-row';

// ----------------------------------------------------------------------

export function CashFlowTable({ cashFlow = [], onView, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const paginated = useMemo(
    () => cashFlow.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [cashFlow, page, rowsPerPage]
  );

  if (!loading && !cashFlow.length) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Nessun prelievo trovato. Clicca "Nuovo Prelievo" per crearne uno.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data</TableCell>
              <TableCell>Dipendente</TableCell>
              <TableCell>Conto</TableCell>
              <TableCell align="right">Importo</TableCell>
              <TableCell align="right">Speso</TableCell>
              <TableCell align="right">Residuo</TableCell>
              <TableCell>Stato</TableCell>
              <TableCell align="right" sx={{ width: 60 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((row) => (
              <CashFlowTableRow key={row.id} row={row} onView={onView} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={cashFlow.length}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        labelRowsPerPage="Righe:"
      />
    </Paper>
  );
}
