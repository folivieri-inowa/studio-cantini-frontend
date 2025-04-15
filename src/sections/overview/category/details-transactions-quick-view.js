import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { _mock as subject, PRODUCT_STOCK_OPTIONS } from '../../../_mock';
import axios, { endpoints } from '../../../utils/axios';
import Scrollbar from '../../../components/scrollbar/scrollbar';
import PrimaNotaTableRow from '../../prima-nota/prima-nota-table-row';
import PrimaNotaTableToolbar from '../../prima-nota/prima-nota-table-toolbar';
import PrimaNotaTableFiltersResult from '../../prima-nota/prima-nota-table-filters-result';
import {
  useTable, emptyRows,
  TableNoData,
  getComparator, TableSkeleton, TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction, TablePaginationCustom,
} from '../../../components/table';
import { useSettingsContext } from '../../../components/settings';

// ----------------------------------------------------------------------

const defaultFilters = {
  owner: '',
  description: '',
  status: []
};

const PUBLISH_OPTIONS = [
  { value: 'pending', label: 'In revisione' },
  { value: 'completed', label: 'Completate' },
  { value: 'toCheck', label: 'Da controllare' },
];

const TABLE_HEAD = [
  { id: 'date', label: 'Data' },
  { id: 'description', label: 'Descrizione' },
  { id: 'owner', label: 'Intestatario conto', width: 180 },
  { id: 'amount', label: 'Importo' },
];

export default function DetailsTransactionsQuickView({ data, open, onClose }) {
  const table = useTable();

  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    const fetchData = async () => {
      setTransactionsLoading(true)

      try {
        const response = await axios.post(endpoints.prima_nota.filtered_list, data);
        if (response.status === 200) {
          setTableData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching master data:", error);
      }
      setTransactionsLoading(false);
    };

    if (open && data) {
      fetchData();
      table.setRowsPerPage(rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const denseHeight = table.dense ? 60 : 80;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset);

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);


  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>
        <Typography variant="h5" gutterBottom>
          Elenco movimenti
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          <PrimaNotaTableToolbar
            filters={filters}
            onFilters={handleFilters}
            //
            publishOptions={PUBLISH_OPTIONS}
            stateFilter={false}
          />

          {canReset && (
            <PrimaNotaTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={tableData.length}
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {transactionsLoading ? (
                    [...Array(table.rowsPerPage)].map((i, index) => (
                      <TableSkeleton key={index} sx={{ height: denseHeight }} />
                    ))
                  ) : (
                    <>
                      {dataFiltered
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <PrimaNotaTableRow
                            key={row._id}
                            row={row}
                            selectColumns={false}
                            editable={false}
                            showStatus={false}
                          />
                        ))}
                    </>
                  )}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(e.target.value)
              table.setRowsPerPage(e.target.value);
            }}
            //
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DetailsTransactionsQuickView.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

function applyFilter({ inputData, comparator, filters }) {
  const { name, description, status } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (transaction) => transaction.owner.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (description) {
    inputData = inputData.filter(
      (transaction) => transaction.description.toLowerCase().indexOf(description.toLowerCase()) !== -1
    );
  }

  if (status.length) {
    inputData = inputData.filter((transaction) => status.includes(transaction.status));
  }

  return inputData;
}
