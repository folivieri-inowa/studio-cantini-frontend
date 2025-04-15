import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { fCurrencyEur } from 'src/utils/format-number';

import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

// ----------------------------------------------------------------------

export default function MasterAverageExpenseCategory({ title, subheader, tableData, tableLabels, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.map((row) => (
                <MasterAverageExpenseCategoryRow key={row.id} row={row} />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

MasterAverageExpenseCategory.propTypes = {
  subheader: PropTypes.string,
  tableData: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function MasterAverageExpenseCategoryRow({ row }) {
  return (
    <TableRow>
        <TableCell sx={{ display: 'none'}}>{row.id}</TableCell>

        <TableCell sx={{ width: '50%' }}>{row.category}</TableCell>

        <TableCell>{fCurrencyEur(row.averageCost)}</TableCell>
      </TableRow>
  );
}

MasterAverageExpenseCategoryRow.propTypes = {
  row: PropTypes.object,
};
