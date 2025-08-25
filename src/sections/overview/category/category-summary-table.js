import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { fCurrencyEur } from 'src/utils/format-number';
import { capitalizeCase } from 'src/utils/change-case';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

// ----------------------------------------------------------------------

export default function CategorySummaryTable({ title, subheader, tableData, tableLabels, handleViewRow, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>{tableData.map((row, index) => (
              <CategorySummaryRow key={row.id || `category-${index}`} row={row} />))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

CategorySummaryTable.propTypes = {
  subheader: PropTypes.string,
  tableData: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
  handleViewRow: PropTypes.func,
};

// ----------------------------------------------------------------------

function CategorySummaryRow({ row }) {

  return (
    <TableRow>
        <TableCell>{capitalizeCase(row.subcategory)}</TableCell>

        <TableCell>{fCurrencyEur(row.income)}</TableCell>

        <TableCell>{fCurrencyEur(row.expense)}</TableCell>

        <TableCell>
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

CategorySummaryRow.propTypes = {
  row: PropTypes.object,
};
