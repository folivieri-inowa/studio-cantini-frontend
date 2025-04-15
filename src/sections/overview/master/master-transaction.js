import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { fCurrencyEur } from 'src/utils/format-number';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import Link from '@mui/material/Link';

// ----------------------------------------------------------------------

export default function MasterTransaction({
  title,
  subheader,
  tableData,
  tableLabels,
  handleViewRow,
  ...other
}) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

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

      <Link
        noWrap
        color="inherit"
        variant="subtitle2"
        onClick={onViewRow}
        sx={{ cursor: 'pointer' }}
      >
        <TableCell>{row.category}</TableCell>
      </Link>

     <TableCell align="right">{fCurrencyEur(row.income)}</TableCell>

      <TableCell align="right">{fCurrencyEur(row.expense)}</TableCell>

      <TableCell align="right">{fCurrencyEur(row.averageCost)}</TableCell>

      <TableCell align="right">
        <Label
          variant="soft"
          color={parseFloat(row.difference.toFixed(2)) > 0 ? 'success' : 'error'}
        >
          {fCurrencyEur(row.difference.toFixed(2))}
        </Label>
      </TableCell>
    </TableRow>
  );
}

MasterTransactionRow.propTypes = {
  row: PropTypes.object,
  onViewRow: PropTypes.func,
};
