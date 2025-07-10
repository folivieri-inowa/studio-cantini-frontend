import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import AlertTitle from '@mui/material/AlertTitle';
import TableContainer from '@mui/material/TableContainer';

import Label from '../../../components/label';
import Scrollbar from '../../../components/scrollbar';
import { TableHeadCustom } from '../../../components/table';
import { fCurrencyEur } from '../../../utils/format-number';

// ----------------------------------------------------------------------

// Funzione helper per gestire valori null/undefined e mostrare sempre 0
const formatCurrencyWithZero = (value) => {
  if (value === null || value === undefined || value === '') {
    return fCurrencyEur(0);
  }
  return fCurrencyEur(value);
};

export default function MasterTransaction({
  title,
  subheader,
  tableData,
  tableLabels,
  handleViewRow,
  ...other
}) {
  // Verifica se ci sono dati da visualizzare
  const hasData = tableData && tableData.length > 0;

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      {!hasData ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Nessun dato disponibile</AlertTitle>
            Non ci sono dati disponibili per il conto e l&apos;anno selezionati. Prova a selezionare un altro anno o un altro conto.
          </Alert>
        </Box>
      ) : (
        <TableContainer sx={{ overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 680 }}>
              <TableHeadCustom headLabel={tableLabels} />

              <TableBody>
                {tableData.map((row) => (
                  <MasterTransactionRow
                    key={row.id}
                    row={row}
                    onViewRow={() => handleViewRow(row.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      )}
    </Card>
  );
}

MasterTransaction.propTypes = {
  subheader: PropTypes.string,
  tableData: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
  handleViewRow: PropTypes.func,
};

// ----------------------------------------------------------------------

function MasterTransactionRow({ row, onViewRow }) {
  return (
    <TableRow>
      <TableCell sx={{ display: 'none' }}>{row.id}</TableCell>

      <TableCell>
        <Link
          noWrap
          color="inherit"
          variant="subtitle2"
          onClick={onViewRow}
          sx={{ cursor: 'pointer' }}
        >
          {row.category}
        </Link>
      </TableCell>

      <TableCell align="right">{formatCurrencyWithZero(row.income)}</TableCell>

      <TableCell align="right">{formatCurrencyWithZero(row.expense)}</TableCell>

      <TableCell align="right">{formatCurrencyWithZero(row.averageCost)}</TableCell>

      <TableCell align="right">{formatCurrencyWithZero(row.totalExpense)}</TableCell>

      <TableCell align="right">
        <Label
          variant="soft"
          color={parseFloat(row.difference || 0) > 0 ? 'success' : 'error'}
        >
          {formatCurrencyWithZero(row.difference)}
        </Label>
      </TableCell>
    </TableRow>
  );
}

MasterTransactionRow.propTypes = {
  row: PropTypes.object,
  onViewRow: PropTypes.func,
};
