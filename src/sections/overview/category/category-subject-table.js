'use client';

import { Fragment, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { fCurrencyEur } from '../../../utils/format-number';
import { capitalizeCase } from '../../../utils/change-case';
import Scrollbar from '../../../components/scrollbar';
import Iconify from '../../../components/iconify';
import { useBoolean } from '../../../hooks/use-boolean';
import DetailsTransactionsQuickView from './details-transactions-quick-view';
import SubjectChartQuickView from './subject-chart-quick-view';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const columnHelper = createColumnHelper();
const formatCurrency = (value) => fCurrencyEur(value ?? 0);

function calcDelta(value, reference, isExpense) {
  if (value == null || value === 0 || reference == null) return null;
  const raw = ((reference - value) / Math.abs(value)) * 100;
  return isExpense ? -raw : raw;
}

function DeltaCell({ value, referenceValue, referenceYear, isExpense, month }) {
  const delta = calcDelta(value, referenceValue, isExpense);
  const isPositive = delta !== null && (isExpense ? delta >= 0 : delta <= 0);
  const arrow = delta === null ? '' : (isPositive ? '↑' : '↓');
  const deltaColor = delta === null ? 'text.disabled' : (isPositive ? 'success.main' : 'error.main');
  const monthLabel = MONTHS[month - 1] ?? '';
  const diffAbsolute = isExpense ? value - referenceValue : referenceValue - value;
  const sign = diffAbsolute >= 0 ? '+' : '';
  const tooltipText = delta !== null
    ? `${sign}${formatCurrency(diffAbsolute)} rispetto al periodo Gen–${monthLabel} ${referenceYear} (${sign}${delta.toFixed(1)}%)`
    : 'Nessun dato di riferimento';

  return (
    <Tooltip title={tooltipText} placement="top" arrow>
      <Box sx={{ textAlign: 'right', cursor: 'default' }}>
        <Typography variant="body1">{formatCurrency(value)}</Typography>
        {delta !== null && (
          <Typography variant="body2" sx={{ color: deltaColor, display: 'block', lineHeight: 1.2 }}>
            {arrow} {Math.abs(delta).toFixed(1)}% vs {referenceYear}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

DeltaCell.propTypes = {
  value: PropTypes.number,
  referenceValue: PropTypes.number,
  referenceYear: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  isExpense: PropTypes.bool,
  month: PropTypes.number,
};

// ----------------------------------------------------------------------

export default function CategorySubjectTable({
  reportCategory,
  selectedMonth,
  showPrevYear,
  initShowIncome,
  initShowExpense,
  onViewRow,
  db,
  owner,
  year,
  exclusions = [],  // ← ADD
}) {
  const [showIncome, setShowIncome] = useState(initShowIncome ?? true);
  const [showExpense, setShowExpense] = useState(initShowExpense ?? true);
  const [sorting, setSorting] = useState([{ id: 'name', desc: false }]);
  const [expanded, setExpanded] = useState({});
  const [transactionsData, setTransactionsData] = useState(null);
  const transactionsModal = useBoolean();
  const [chartData, setChartData] = useState(null);
  const chartModal = useBoolean();

  const mainYear = reportCategory.year;
  const prevYear = reportCategory.prevYear;
  const categoryId = reportCategory.categoryId;
  const monthLabel = MONTHS[selectedMonth - 1] ?? '';

  const handleViewTransactions = (params) => {
    setTransactionsData({ db, owner, year, month: selectedMonth, category: categoryId, ...params });
    transactionsModal.onTrue();
  };

  const handleViewChart = (params) => {
    setChartData({ db, owner, year, month: selectedMonth, category: categoryId, categoryName: reportCategory.categoryName, ...params });
    chartModal.onTrue();
  };

  // tableData da averageMonthlyCosts — usa i campi YTD calcolati dal backend
  const tableData = useMemo(() =>
    (reportCategory.averageMonthlyCosts || []).map(row => ({
      id: row.id,
      name: row.category,
      ytdIncome: parseFloat(row.ytdIncome ?? row.totalIncome ?? 0),
      ytdExpense: parseFloat(row.ytdExpense ?? row.totalExpense ?? 0),
      prevYtdIncome:  parseFloat(row.prevYtdIncome ?? row.prevTotalIncome ?? 0),
      prevYtdExpense: parseFloat(row.prevYtdExpense ?? row.prevTotalExpense ?? 0),
      values: row.values || [],
    }))
  , [reportCategory]);

  // Totali footer da monthlyTotals YTD (aggregato categoria)
  const categoryYtd = useMemo(() => {
    const totals = { income: 0, expense: 0, prevIncome: 0, prevExpense: 0 };
    if (!reportCategory.monthlyTotals) return totals;
    for (let m = 1; m <= selectedMonth; m += 1) {
      const md = reportCategory.monthlyTotals[m] ?? {};
      totals.income += parseFloat(md.income ?? 0);
      totals.expense += parseFloat(md.expense ?? 0);
      totals.prevIncome += parseFloat(md.prevIncome ?? 0);
      totals.prevExpense += parseFloat(md.prevExpense ?? 0);
    }
    return totals;
  }, [reportCategory.monthlyTotals, selectedMonth]);

  const columns = useMemo(() => {
    const cols = [
      // Expand
      columnHelper.display({
        id: 'expand',
        header: '',
        enableSorting: false,
        size: 50,
        cell: ({ row }) => row.original.values?.length > 0 ? (
          <IconButton
            size="small"
            onClick={() => setExpanded(prev => ({ ...prev, [row.id]: !prev[row.id] }))}
          >
            <Iconify icon={expanded[row.id] ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />
          </IconButton>
        ) : <Box sx={{ width: 34 }} />,
      }),
      // Soggetto
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Soggetto',
        size: 300,
        cell: info => (
          <Typography variant="subtitle1" noWrap>
            {capitalizeCase(info.getValue())}
          </Typography>
        ),
      }),
    ];

    if (showIncome) {
      cols.push(
        columnHelper.accessor('ytdIncome', {
          id: `income_${mainYear}`,
          header: `Entrate ${mainYear}`,
          size: 160,
          cell: info => (
            <Typography variant="body1" sx={{ textAlign: 'right' }}>
              {formatCurrency(info.getValue())}
            </Typography>
          ),
        })
      );
      if (showPrevYear) {
        cols.push(
          columnHelper.accessor('prevYtdIncome', {
            id: `income_${prevYear}`,
            header: `Entrate ${prevYear}`,
            size: 200,
            cell: info => (
              <DeltaCell
                value={info.getValue()}
                referenceValue={info.row.original.ytdIncome}
                referenceYear={mainYear}
                isExpense={false}
                month={selectedMonth}
              />
            ),
          })
        );
      }
    }

    if (showExpense) {
      cols.push(
        columnHelper.accessor('ytdExpense', {
          id: `expense_${mainYear}`,
          header: `Uscite ${mainYear}`,
          size: 160,
          cell: info => (
            <Typography variant="body1" sx={{ textAlign: 'right' }}>
              {formatCurrency(info.getValue())}
            </Typography>
          ),
        })
      );
      if (showPrevYear) {
        cols.push(
          columnHelper.accessor('prevYtdExpense', {
            id: `expense_${prevYear}`,
            header: `Uscite ${prevYear}`,
            size: 200,
            cell: info => (
              <DeltaCell
                value={info.getValue()}
                referenceValue={info.row.original.ytdExpense}
                referenceYear={mainYear}
                isExpense
                month={selectedMonth}
              />
            ),
          })
        );
      }
    }

    // Azioni
    cols.push(
      columnHelper.display({
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 100,
        cell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
              <IconButton
                size="small"
                onClick={() => handleViewTransactions({ subject: row.original.id })}
              >
                <Iconify icon="solar:document-text-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vedi grafici" placement="top" arrow>
              <IconButton
                size="small"
                onClick={() => handleViewChart({ subject: row.original.id, subjectName: row.original.name })}
              >
                <Iconify icon="solar:chart-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      })
    );

    return cols;
  }, [showIncome, showExpense, showPrevYear, mainYear, prevYear, selectedMonth, expanded, categoryId, handleViewTransactions, handleViewChart]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    defaultColumn: { minSize: 50 },
  });

  const headerAction = (
    <Stack direction="row" spacing={2} alignItems="center">
      <FormControlLabel
        control={<Checkbox size="small" checked={showIncome} onChange={e => setShowIncome(e.target.checked)} />}
        label={<Typography variant="body2">Entrate</Typography>}
        sx={{ mr: 0 }}
      />
      <FormControlLabel
        control={<Checkbox size="small" checked={showExpense} onChange={e => setShowExpense(e.target.checked)} />}
        label={<Typography variant="body2">Uscite</Typography>}
        sx={{ mr: 0 }}
      />
    </Stack>
  );

  const compareLabel = showPrevYear && prevYear ? ` · confronto con ${prevYear}` : '';

  return (
    <Card>
      <CardHeader
        title="Riepilogo per soggetto"
        subheader={`Spesa mensile da Gen a ${monthLabel} ${mainYear}${compareLabel}`}
        action={headerAction}
        sx={{ mb: 1 }}
      />      <TableContainer>
        <Scrollbar>
          <Table sx={{ minWidth: 680, tableLayout: 'fixed' }}>
            <colgroup>
              {table.getVisibleLeafColumns().map(col => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>
            <TableHead>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(header => (
                    <TableCell
                      key={header.id}
                      align={['expand', 'actions', 'name'].includes(header.id) ? 'left' : 'right'}
                      sortDirection={
                        header.column.getIsSorted() === 'asc' ? 'asc' :
                        header.column.getIsSorted() === 'desc' ? 'desc' : false
                      }
                    >
                      {header.column.getCanSort() ? (
                        <TableSortLabel
                          active={!!header.column.getIsSorted()}
                          direction={header.column.getIsSorted() === 'asc' ? 'asc' : 'desc'}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </TableSortLabel>
                      ) : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {table.getRowModel().rows.map(row => (
                <Fragment key={row.id}>
                  <TableRow hover>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        align={['expand', 'actions', 'name'].includes(cell.column.id) ? 'left' : 'right'}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Righe espanse — dettagli soggetto */}
                  {expanded[row.id] && row.original.values?.length > 0 && (() => {
                    // Legge le larghezze reali delle colonne dalla tabella madre
                    const cols = table.getVisibleLeafColumns();
                    const colWidths = Object.fromEntries(cols.map(c => [c.id, c.getSize()]));

                    return (
                      <TableRow key={`${row.id}-expanded`}>
                        <TableCell colSpan={cols.length} sx={{ py: 0, px: 0, bgcolor: 'background.neutral' }}>
                          <Collapse in timeout="auto" unmountOnExit>
                            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
                              <colgroup>
                                {cols.map(c => (
                                  <col key={c.id} style={{ width: colWidths[c.id] || 'auto' }} />
                                ))}
                              </colgroup>
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ width: colWidths.expand }} />
                                  <TableCell sx={{ color: 'text.secondary', width: colWidths.name }}>Dettaglio</TableCell>
                                  {showIncome && <TableCell align="right" sx={{ color: 'text.secondary', width: colWidths[`income_${mainYear}`] }}>Entrate {mainYear}</TableCell>}
                                  {showIncome && showPrevYear && <TableCell align="right" sx={{ color: 'text.secondary', width: colWidths[`income_${prevYear}`] }}>Entrate {prevYear}</TableCell>}
                                  {showExpense && <TableCell align="right" sx={{ color: 'text.secondary', width: colWidths[`expense_${mainYear}`] }}>Uscite {mainYear}</TableCell>}
                                  {showExpense && showPrevYear && <TableCell align="right" sx={{ color: 'text.secondary', width: colWidths[`expense_${prevYear}`] }}>Uscite {prevYear}</TableCell>}
                                  <TableCell sx={{ width: colWidths.actions }} />
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {row.original.values.map((val, idx) => (
                                  <TableRow key={val.id || idx}>
                                    <TableCell />
                                    <TableCell>
                                      <Typography variant="body2">{capitalizeCase(val.title)}</Typography>
                                    </TableCell>
                                    {showIncome && (
                                      <TableCell align="right">
                                        <Typography variant="body2">{formatCurrency(parseFloat(val.ytdIncome ?? val.totalIncome ?? 0))}</Typography>
                                      </TableCell>
                                    )}
                                    {showIncome && showPrevYear && (
                                      <TableCell align="right">
                                        <DeltaCell
                                          value={parseFloat(val.prevYtdIncome ?? val.prevTotalIncome ?? 0)}
                                          referenceValue={parseFloat(val.ytdIncome ?? val.totalIncome ?? 0)}
                                          referenceYear={mainYear}
                                          isExpense={false}
                                          month={selectedMonth}
                                        />
                                      </TableCell>
                                    )}
                                    {showExpense && (
                                      <TableCell align="right">
                                        <Typography variant="body2">{formatCurrency(parseFloat(val.ytdExpense ?? val.totalExpense ?? 0))}</Typography>
                                      </TableCell>
                                    )}
                                    {showExpense && showPrevYear && (
                                      <TableCell align="right">
                                        <DeltaCell
                                          value={parseFloat(val.prevYtdExpense ?? val.prevTotalExpense ?? 0)}
                                          referenceValue={parseFloat(val.ytdExpense ?? val.totalExpense ?? 0)}
                                          referenceYear={mainYear}
                                          isExpense
                                          month={selectedMonth}
                                        />
                                      </TableCell>
                                    )}
                                    <TableCell align="right">
                                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                        <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
                                          <IconButton size="small" onClick={() => handleViewTransactions({ details: val.id, subject: row.original.id })}>
                                            <Iconify icon="solar:document-text-bold" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Vedi grafici" placement="top" arrow>
                                          <IconButton size="small" onClick={() => handleViewChart({ subject: row.original.id, subjectName: row.original.name })}>
                                            <Iconify icon="solar:chart-bold" />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    );
                  })()}
                </Fragment>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ '& td': { borderTop: 2, borderColor: 'divider' } }}>
                {table.getVisibleLeafColumns().map(col => {
                  if (col.id === 'expand') return <TableCell key={col.id} />;
                  if (col.id === 'actions') return <TableCell key={col.id} />;
                  if (col.id === 'name') return (
                    <TableCell key={col.id}>
                      <Typography variant="subtitle1">Totale categoria</Typography>
                    </TableCell>
                  );
                  if (col.id === `income_${mainYear}`) return (
                    <TableCell key={col.id} align="right">
                      <Typography variant="subtitle1">{formatCurrency(categoryYtd.income)}</Typography>
                    </TableCell>
                  );
                  if (col.id === `income_${prevYear}`) return (
                    <TableCell key={col.id} align="right">
                      <DeltaCell
                        value={categoryYtd.prevIncome}
                        referenceValue={categoryYtd.income}
                        referenceYear={mainYear}
                        isExpense={false}
                        month={selectedMonth}
                      />
                    </TableCell>
                  );
                  if (col.id === `expense_${mainYear}`) return (
                    <TableCell key={col.id} align="right">
                      <Typography variant="subtitle1">{formatCurrency(categoryYtd.expense)}</Typography>
                    </TableCell>
                  );
                  if (col.id === `expense_${prevYear}`) return (
                    <TableCell key={col.id} align="right">
                      <DeltaCell
                        value={categoryYtd.prevExpense}
                        referenceValue={categoryYtd.expense}
                        referenceYear={mainYear}
                        isExpense
                        month={selectedMonth}
                      />
                    </TableCell>
                  );
                  return <TableCell key={col.id} />;
                })}
              </TableRow>
            </TableFooter>
          </Table>
        </Scrollbar>
      </TableContainer>

      <DetailsTransactionsQuickView
        data={transactionsData}
        open={transactionsModal.value}
        onClose={transactionsModal.onFalse}
      />

      <SubjectChartQuickView
        data={chartData}
        open={chartModal.value}
        onClose={chartModal.onFalse}
        exclusions={exclusions}
      />
    </Card>
  );
}

CategorySubjectTable.propTypes = {
  reportCategory: PropTypes.object.isRequired,
  selectedMonth: PropTypes.number.isRequired,
  showPrevYear: PropTypes.bool,
  initShowIncome: PropTypes.bool,
  initShowExpense: PropTypes.bool,
  onViewRow: PropTypes.func,
  db: PropTypes.string,
  owner: PropTypes.string,
  year: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  exclusions: PropTypes.array,
};
