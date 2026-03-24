'use client';

import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import axios, { endpoints } from '../../../utils/axios';
import Scrollbar from '../../../components/scrollbar/scrollbar';
import Iconify from '../../../components/iconify';
import PrimaNotaTableRow from '../../prima-nota/prima-nota-table-row';
import {
  useTable, emptyRows,
  TableNoData,
  getComparator, TableSkeleton, TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from '../../../components/table';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const TABLE_HEAD = [
  { id: 'date', label: 'Data' },
  { id: 'description', label: 'Descrizione' },
  { id: 'owner', label: 'Intestatario conto', width: 180 },
  { id: 'amount', label: 'Importo', align: 'right' },
  { id: '', label: '' },
];

export default function DetailsTransactionsQuickView({ data, open, onClose }) {
  const table = useTable({ defaultOrderBy: 'date', defaultOrder: 'asc' });

  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [descriptionFilter, setDescriptionFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setTransactionsLoading(true);
      try {
        if (!data) { setTableData([]); setTransactionsLoading(false); return; }

        const response = await axios.post(endpoints.prima_nota.filtered_list, data);
        if (response.status === 200 && response.data?.data?.data && Array.isArray(response.data.data.data)) {
          const formattedData = response.data.data.data.map((item, index) => ({
            _id: `transaction-${index}`,
            date: item.date,
            description: item.description,
            ownername: item.ownername || 'Non specificato',
            ownerid: item.ownerid || null,
            amount: item.amount,
            status: 'completed',
          }));
          setTableData(formattedData);
        } else {
          setTableData([]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTableData([]);
      }
      setTransactionsLoading(false);
    };

    if (!open) {
      setTableData([]);
      setDescriptionFilter('');
    } else if (open && data) {
      fetchData();
      table.setRowsPerPage(rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, data]);

  // Filtro descrizione client-side
  const dataFiltered = tableData.filter(row => {
    if (!descriptionFilter) return true;
    return row.description?.toLowerCase().includes(descriptionFilter.toLowerCase());
  });

  // Ordinamento
  const stabilized = dataFiltered.map((el, index) => [el, index]);
  stabilized.sort((a, b) => {
    const order = getComparator(table.order, table.orderBy)(a[0], b[0]);
    return order !== 0 ? order : a[1] - b[1];
  });
  const dataOrdered = stabilized.map(el => el[0]);

  const denseHeight = table.dense ? 60 : 80;

  // Label periodo di riferimento
  const periodLabel = (() => {
    const y = data?.year;
    if (!y || y === 'all-years') return '';
    const m = data?.month ? parseInt(data.month, 10) : null;
    if (!m || m === 12) return `Anno ${y}`;
    return `Gen – ${MONTHS[m - 1]} ${y}`;
  })();

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Elenco movimenti</Typography>
          {periodLabel && (
            <Chip
              icon={<Iconify icon="solar:calendar-bold" />}
              label={periodLabel}
              size="small"
              color="primary"
              variant="soft"
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ pt: 1 }}>
            <TextField
              size="small"
              placeholder="Cerca per descrizione..."
              value={descriptionFilter}
              onChange={e => setDescriptionFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: descriptionFilter ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setDescriptionFilter('')}>
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ width: 320 }}
            />
          </Box>

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
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
                    [...Array(table.rowsPerPage)].map((_, index) => (
                      <TableSkeleton key={`skeleton-${index}`} sx={{ height: denseHeight }} />
                    ))
                  ) : (
                    <>
                      {dataOrdered
                        .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                        .map((row, index) => (
                          <PrimaNotaTableRow
                            key={row._id || `row-${index}`}
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
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataOrdered.length)}
                  />
                  <TableNoData notFound={!dataOrdered.length && !transactionsLoading} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={dataOrdered.length}
            page={table.page}
            rowsPerPage={rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(e.target.value);
              table.setRowsPerPage(e.target.value);
            }}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}

DetailsTransactionsQuickView.propTypes = {
  data: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
