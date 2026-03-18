'use client';

import { useMemo, useState } from 'react';
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
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { useRouter } from '../../../../routes/hooks';
import { paths } from '../../../../routes/paths';
import { fCurrencyEur } from '../../../../utils/format-number';
import Scrollbar from '../../../../components/scrollbar';

// ----------------------------------------------------------------------

const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

const columnHelper = createColumnHelper();

// Formatta un valore come valuta EUR
const formatCurrency = (value) => fCurrencyEur(value ?? 0);

// Calcola il delta percentuale tra due valori
function calcDelta(value, reference, isExpense) {
  if (!reference || reference === 0) return null;
  const raw = ((value - reference) / Math.abs(reference)) * 100;
  return isExpense ? -raw : raw;
}

// Componente cella con delta sotto-testo + tooltip
function DeltaCell({ value, referenceValue, referenceYear, isExpense, month }) {
  const delta = calcDelta(value, referenceValue, isExpense);
  const isPositive = delta !== null && delta >= 0;
  const arrow = delta === null ? '' : (isPositive ? '↑' : '↓');
  const deltaColor = delta === null ? 'text.disabled' : (isPositive ? 'success.main' : 'error.main');
  const monthLabel = MONTHS[month - 1] ?? '';

  const diffAbsolute = value - referenceValue;
  const sign = diffAbsolute >= 0 ? '+' : '';
  const tooltipText = delta !== null
    ? `${sign}${formatCurrency(diffAbsolute)} rispetto al ${referenceYear} (${sign}${delta.toFixed(1)}% YTD ${monthLabel})`
    : 'Nessun dato di riferimento';

  return (
    <Tooltip title={tooltipText} placement="top" arrow>
      <Box sx={{ textAlign: 'right', cursor: 'default' }}>
        <Typography variant="body2">{formatCurrency(value)}</Typography>
        {delta !== null && (
          <Typography variant="caption" sx={{ color: deltaColor, display: 'block', lineHeight: 1.2 }}>
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

export default function MasterCategoryTable({ data, mainYear, owner }) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const defaultMonth = mainYear >= currentYear ? currentMonth : 12;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const availableCompareYears = useMemo(() => {
    if (!data || data.length === 0) return [];
    const years = new Set();
    data.forEach(ownerData => {
      ownerData.report?.years?.forEach(y => {
        if (Number(y) !== Number(mainYear)) years.add(Number(y));
      });
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [data, mainYear]);

  const [compareYears, setCompareYears] = useState(() => {
    const prev = mainYear - 1;
    return availableCompareYears.includes(prev) ? [prev] : availableCompareYears.slice(0, 1);
  });

  const [showIncome, setShowIncome] = useState(true);
  const [showExpense, setShowExpense] = useState(true);
  const [sorting, setSorting] = useState([]);

  const tableData = useMemo(() => {
    if (!data || data.length === 0 || !owner) return [];

    const ownerData = owner.id === 'all-accounts'
      ? data.find(o => o.id === 'all-accounts') ?? owner
      : data.find(o => o.id === owner.id);

    if (!ownerData?.report?.categoryReport) return [];

    const allYears = [mainYear, ...compareYears];
    const categories = {};

    allYears.forEach(year => {
      const categoryReport = ownerData.report.categoryReport[year] ?? {};
      Object.entries(categoryReport).forEach(([catId, catData]) => {
        if (!categories[catId]) {
          categories[catId] = {
            id: catId,
            name: catData.name ?? catId,
            income: {},
            expense: {},
          };
        }

        let ytdIncome = 0;
        let ytdExpense = 0;
        for (let m = 1; m <= selectedMonth; m += 1) {
          const monthKey = String(m).padStart(2, '0');
          const monthData = catData.months?.[monthKey] ?? {};
          ytdIncome += parseFloat(monthData.income ?? 0);
          ytdExpense += parseFloat(monthData.expense ?? 0);
        }

        categories[catId].income[year] = parseFloat(ytdIncome.toFixed(2));
        categories[catId].expense[year] = parseFloat(ytdExpense.toFixed(2));
      });
    });

    return Object.values(categories).filter(cat => cat.name);
  }, [data, owner, mainYear, compareYears, selectedMonth]);

  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Categoria',
        enableSorting: false,
        cell: info => (
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => {
              const params = new URLSearchParams({
                month: selectedMonth,
                compareYears: compareYears.join(','),
                showIncome: String(showIncome),
                showExpense: String(showExpense),
              });
              router.push(`${paths.dashboard.master.category.details({ id: info.row.original.id })}?${params.toString()}`);
            }}
          >
            {info.getValue()}
          </Typography>
        ),
      }),
    ];

    if (showIncome) {
      cols.push(
        columnHelper.accessor(row => row.income[mainYear] ?? 0, {
          id: `income_${mainYear}`,
          header: `Entrate ${mainYear}`,
          cell: info => (
            <Typography variant="body2" sx={{ textAlign: 'right' }}>
              {formatCurrency(info.getValue())}
            </Typography>
          ),
        })
      );

      compareYears.forEach(year => {
        cols.push(
          columnHelper.accessor(row => row.income[year] ?? 0, {
            id: `income_${year}`,
            header: `Entrate ${year}`,
            cell: info => (
              <DeltaCell
                value={info.getValue()}
                referenceValue={info.row.original.income[mainYear] ?? 0}
                referenceYear={mainYear}
                isExpense={false}
                month={selectedMonth}
              />
            ),
          })
        );
      });
    }

    if (showExpense) {
      cols.push(
        columnHelper.accessor(row => row.expense[mainYear] ?? 0, {
          id: `expense_${mainYear}`,
          header: `Uscite ${mainYear}`,
          cell: info => (
            <Typography variant="body2" sx={{ textAlign: 'right' }}>
              {formatCurrency(info.getValue())}
            </Typography>
          ),
        })
      );

      compareYears.forEach(year => {
        cols.push(
          columnHelper.accessor(row => row.expense[year] ?? 0, {
            id: `expense_${year}`,
            header: `Uscite ${year}`,
            cell: info => (
              <DeltaCell
                value={info.getValue()}
                referenceValue={info.row.original.expense[mainYear] ?? 0}
                referenceYear={mainYear}
                isExpense
                month={selectedMonth}
              />
            ),
          })
        );
      });
    }

    return cols;
  }, [showIncome, showExpense, compareYears, mainYear, selectedMonth, router]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const hasData = tableData.length > 0;

  const headerAction = (
    <Stack direction="row" spacing={2} alignItems="center">
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={showIncome}
            onChange={e => setShowIncome(e.target.checked)}
          />
        }
        label={<Typography variant="body2">Entrate</Typography>}
        sx={{ mr: 0 }}
      />
      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={showExpense}
            onChange={e => setShowExpense(e.target.checked)}
          />
        }
        label={<Typography variant="body2">Uscite</Typography>}
        sx={{ mr: 0 }}
      />
      {availableCompareYears.length > 0 && (
        <Select
          multiple
          size="small"
          value={compareYears}
          onChange={e => {
            const val = e.target.value.slice(0, 2);
            setCompareYears(val);
          }}
          renderValue={selected => selected.join(', ')}
          displayEmpty
          sx={{ minWidth: 120 }}
        >
          {availableCompareYears.map(year => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      )}
    </Stack>
  );

  return (
    <Card>
      <CardHeader
        title="Riepilogo per categorie"
        subheader={`YTD fino a ${MONTHS[selectedMonth - 1]} ${mainYear}`}
        action={headerAction}
        sx={{ mb: 1 }}
      />

      {/* Barra navigazione mensile */}
      <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedMonth - 1}
          onChange={(_, newIndex) => setSelectedMonth(newIndex + 1)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {MONTHS.map((month) => (
            <Tab key={month} label={month} sx={{ minWidth: 56, px: 1 }} />
          ))}
        </Tabs>
      </Box>

      {/* Tabella */}
      {!hasData ? (
        <Box sx={{ p: 3 }}>
          <Alert severity="info">
            <AlertTitle>Nessun dato disponibile</AlertTitle>
            Non ci sono dati per il conto e l&apos;anno selezionati.
          </Alert>
        </Box>
      ) : (
        <TableContainer>
          <Scrollbar>
            <Table sx={{ minWidth: 680 }}>
              <TableHead>
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableCell
                        key={header.id}
                        align={header.id === 'name' ? 'left' : 'right'}
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
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableHead>
              <TableBody>
                {table.getRowModel().rows.map(row => (
                  <TableRow key={row.id} hover>
                    {row.getVisibleCells().map(cell => (
                      <TableCell
                        key={cell.id}
                        align={cell.column.id === 'name' ? 'left' : 'right'}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      )}
    </Card>
  );
}

MasterCategoryTable.propTypes = {
  data: PropTypes.array.isRequired,
  mainYear: PropTypes.number.isRequired,
  owner: PropTypes.object,
};
