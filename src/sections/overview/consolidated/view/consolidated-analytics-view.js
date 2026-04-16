'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuthContext } from '../../../../auth/hooks';
import { useBoolean } from '../../../../hooks/use-boolean';
import axios, { endpoints } from '../../../../utils/axios';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import MasterCategoryTable from '../../master/master-category-table';
import MasterMonthBreakdownDialog from '../../master/master-month-breakdown-dialog';
import MasterMonthlyTrendChart from '../../master/master-monthly-trend-chart';

// ----------------------------------------------------------------------

const MONTHS_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

function buildAllAccountsOwner(data) {
  if (!data || data.length === 0) return null;

  const nonCreditCardOwners = data.filter((o) => o.id !== 'all-accounts' && !o.isCreditCard);

  const allAccounts = {
    id: 'all-accounts',
    name: 'Tutti i conti',
    cc: '',
    iban: '',
    initialBalance: 0,
    balanceDate: null,
    isCreditCard: false,
    report: { years: [], globalReport: {}, categoryReport: {} },
  };

  const allYears = new Set();
  nonCreditCardOwners.forEach((o) => o.report?.years?.forEach((y) => allYears.add(y)));
  allAccounts.report.years = Array.from(allYears).sort((a, b) => b - a);

  allAccounts.report.years.forEach((year) => {
    allAccounts.report.globalReport[year] = { income: 0, expense: 0, months: {} };
    for (let m = 1; m <= 12; m += 1) {
      allAccounts.report.globalReport[year].months[String(m).padStart(2, '0')] = { income: 0, expense: 0 };
    }
    nonCreditCardOwners.forEach((o) => {
      const yr = o.report?.globalReport?.[year];
      if (yr) {
        allAccounts.report.globalReport[year].income += parseFloat(yr.income || 0);
        allAccounts.report.globalReport[year].expense += parseFloat(yr.expense || 0);
        Object.entries(yr.months || {}).forEach(([monthKey, md]) => {
          allAccounts.report.globalReport[year].months[monthKey].income += parseFloat(md.income || 0);
          allAccounts.report.globalReport[year].months[monthKey].expense += parseFloat(md.expense || 0);
        });
      }
    });
  });

  return allAccounts;
}

function formatYtdDescription(percentChange, monthLabel, year) {
  if (!monthLabel || year === 'all-years') return undefined;
  const arrow = percentChange >= 0 ? '▲' : '▼';
  const absPct = Math.abs(percentChange).toFixed(1).replace('.', ',');
  return `${arrow} ${absPct}% YTD (Gen – ${monthLabel} ${year})`;
}

function buildTooltipContent(label, total, prevYearTotal, percentChange, monthLabel, year) {
  const prevYear = year !== 'all-years' ? Number(year) - 1 : null;
  const arrow = percentChange >= 0 ? '▲' : '▼';
  const absPct = Math.abs(percentChange).toFixed(1).replace('.', ',');
  return [
    `${label} YTD Gen – ${monthLabel} ${year}`,
    `Totale: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(total)}`,
    prevYear ? `Stesso periodo ${prevYear}: ${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(prevYearTotal)}` : null,
    `Variazione: ${arrow} ${absPct}%`,
  ].filter(Boolean).join('\n');
}

// Hook che gestisce fetch + selezione owner per un singolo db
function useDbData(dbKey) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${endpoints.report.master}${dbKey}`, { params: { _t: Date.now() } })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data.data || [];
        setData(rows);
        const backendAllAccounts = rows.find((o) => o.id === 'all-accounts');
        const allAcc = backendAllAccounts || buildAllAccountsOwner(rows);
        setSelectedOwner(allAcc || rows[0] || null);
      })
      .catch((err) => {
        console.error(`Error fetching master data for ${dbKey}:`, err);
        setError('Errore nel caricamento dei dati.');
      })
      .finally(() => setLoading(false));
  }, [dbKey]);

  const allAccountsOwner = useMemo(
    () => data.find((o) => o.id === 'all-accounts') || buildAllAccountsOwner(data),
    [data]
  );

  const sortedOwners = useMemo(
    () => data.filter((o) => o.id !== 'all-accounts').sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  const ownerOptions = allAccountsOwner ? [allAccountsOwner, ...sortedOwners] : sortedOwners;

  return { data, loading, error, selectedOwner, setSelectedOwner, ownerOptions };
}

// ----------------------------------------------------------------------

function DbSection({ dbKey, dbLabel, year, month, onMonthChange, data, loading, error, selectedOwner }) {
  const [compareYears, setCompareYears] = useState([]);
  const [breakdownMonth, setBreakdownMonth] = useState(null);
  const breakdownDialog = useBoolean();

  const handleBreakdownBarClick = useCallback((idx) => {
    setBreakdownMonth(idx + 1);
    breakdownDialog.onTrue();
  }, [breakdownDialog]);

  const mainYear = year === 'all-years' ? new Date().getFullYear() : Number(year);
  const monthLabel = MONTHS_LABELS[month - 1] ?? '';

  const { incomeData, totalIncome, incomePercentChange, incomePrevYearTotal } = useMemo(() => {
    if (!selectedOwner || year === 'all-years') return { incomeData: [], totalIncome: 0, incomePercentChange: 0, incomePrevYearTotal: 0 };
    const globalReport = selectedOwner.report?.globalReport;
    if (!globalReport || !globalReport[year]) return { incomeData: [], totalIncome: 0, incomePercentChange: 0, incomePrevYearTotal: 0 };

    const sortedMonths = Object.entries(globalReport[year].months).sort(([a], [b]) => Number(a) - Number(b));
    const filtered = sortedMonths.filter(([m]) => Number(m) <= month);
    const series = filtered.map(([, md]) => parseFloat((md?.income ?? 0).toFixed(2)));
    const total = parseFloat(filtered.reduce((sum, [, md]) => sum + (md?.income ?? 0), 0).toFixed(2));

    let percentChange = 0;
    let prevYearTotal = 0;
    const prevYearReport = globalReport[String(Number(year) - 1)];
    if (prevYearReport) {
      const prevFiltered = Object.entries(prevYearReport.months).filter(([m]) => Number(m) <= month);
      prevYearTotal = parseFloat(prevFiltered.reduce((sum, [, md]) => sum + (md?.income ?? 0), 0).toFixed(2));
      if (prevYearTotal !== 0) percentChange = parseFloat(((total - prevYearTotal) / prevYearTotal * 100).toFixed(2));
    }

    return { incomeData: series, totalIncome: total, incomePercentChange: percentChange, incomePrevYearTotal: prevYearTotal };
  }, [selectedOwner, year, month]);

  const { expenseData, totalExpense, expensePercentChange, expensePrevYearTotal } = useMemo(() => {
    if (!selectedOwner || year === 'all-years') return { expenseData: [], totalExpense: 0, expensePercentChange: 0, expensePrevYearTotal: 0 };
    const globalReport = selectedOwner.report?.globalReport;
    if (!globalReport || !globalReport[year]) return { expenseData: [], totalExpense: 0, expensePercentChange: 0, expensePrevYearTotal: 0 };

    const sortedMonths = Object.entries(globalReport[year].months).sort(([a], [b]) => Number(a) - Number(b));
    const filtered = sortedMonths.filter(([m]) => Number(m) <= month);
    const series = filtered.map(([, md]) => parseFloat((md?.expense ?? 0).toFixed(2)));
    const total = parseFloat(filtered.reduce((sum, [, md]) => sum + (md?.expense ?? 0), 0).toFixed(2));

    let percentChange = 0;
    let prevYearTotal = 0;
    const prevYearReport = globalReport[String(Number(year) - 1)];
    if (prevYearReport) {
      const prevFiltered = Object.entries(prevYearReport.months).filter(([m]) => Number(m) <= month);
      prevYearTotal = parseFloat(prevFiltered.reduce((sum, [, md]) => sum + (md?.expense ?? 0), 0).toFixed(2));
      if (prevYearTotal !== 0) percentChange = parseFloat(((total - prevYearTotal) / prevYearTotal * 100).toFixed(2));
    }

    return { expenseData: series, totalExpense: total, expensePercentChange: percentChange, expensePrevYearTotal: prevYearTotal };
  }, [selectedOwner, year, month]);

  const trendSeries = useMemo(() => {
    if (!selectedOwner || year === 'all-years') return [];
    const globalReport = selectedOwner.report?.globalReport;
    if (!globalReport || !globalReport[year]) return [];
    const months = globalReport[year].months || {};
    const expSeries = Array.from({ length: 12 }, (_, i) => {
      const mk = String(i + 1).padStart(2, '0');
      return parseFloat((months[mk]?.expense || 0).toFixed(2));
    });
    return [{ name: `Uscite ${year}`, data: expSeries }];
  }, [selectedOwner, year]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>{dbLabel}</Typography>

      {/* Card entrate / uscite */}
      {year !== 'all-years' && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
          <BankingWidgetSummary
            title="Entrate"
            icon="eva:diagonal-arrow-left-down-fill"
            percent={incomePercentChange}
            total={totalIncome}
            description={formatYtdDescription(incomePercentChange, monthLabel, year)}
            tooltipContent={buildTooltipContent('Entrate', totalIncome, incomePrevYearTotal, incomePercentChange, monthLabel, year)}
            chart={{ series: incomeData }}
          />
          <BankingWidgetSummary
            title="Uscite"
            color="warning"
            icon="eva:diagonal-arrow-right-up-fill"
            percent={expensePercentChange}
            total={totalExpense}
            description={formatYtdDescription(expensePercentChange, monthLabel, year)}
            tooltipContent={buildTooltipContent('Uscite', totalExpense, expensePrevYearTotal, expensePercentChange, monthLabel, year)}
            chart={{ series: expenseData }}
          />
        </Stack>
      )}

      {/* Tabella categorie + grafico trend */}
      {selectedOwner && (
        <Grid container spacing={3}>
          <Grid size={12}>
            <MasterCategoryTable
              data={data}
              mainYear={mainYear}
              owner={selectedOwner}
              selectedMonth={month}
              onMonthChange={onMonthChange}
              onCompareYearsChange={setCompareYears}
            />
          </Grid>

          {year !== 'all-years' && trendSeries.length > 0 && (
            <Grid size={12}>
              <MasterMonthlyTrendChart
                title="Andamento mensile uscite"
                subheader={`Media spese mensili per l'anno ${year}`}
                series={trendSeries}
                categories={MONTHS_LABELS}
                onBarClick={handleBreakdownBarClick}
              />
            </Grid>
          )}
        </Grid>
      )}

      <MasterMonthBreakdownDialog
        open={breakdownDialog.value}
        onClose={breakdownDialog.onFalse}
        month={breakdownMonth}
        year={mainYear}
        owner={selectedOwner}
        db={dbKey}
        compareYears={compareYears}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function ConsolidatedAnalyticsView() {
  const { user } = useAuthContext();
  const router = useRouter();

  const allDbs = user?.allDbs || [];

  useEffect(() => {
    if (user && (!user.allDbs || user.allDbs.length < 2)) {
      router.replace(paths.dashboard.root);
    }
  }, [user, router]);

  const _now = new Date();
  const currentYear = _now.getFullYear().toString();
  const currentMonth = _now.getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const availableYears = useMemo(
    () => ['all-years', currentYear, String(Number(currentYear) - 1), String(Number(currentYear) - 2)],
    [currentYear]
  );

  const db1 = useDbData(allDbs[0]);
  const db2 = useDbData(allDbs[1]);

  const secondSectionRef = useRef(null);
  const [secondVisible, setSecondVisible] = useState(false);

  useEffect(() => {
    if (!secondSectionRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setSecondVisible(true); },
      { rootMargin: '200px' }
    );
    observer.observe(secondSectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (!user || allDbs.length < 2) return null;

  const db1Label = allDbs[0] === 'db1' ? 'Guido' : allDbs[0];
  const db2Label = allDbs[1] === 'db2' ? 'Marta' : allDbs[1];

  return (
    <Container maxWidth="xl">
      {/* Titolo */}
      <Typography variant="h4" sx={{ mb: 2 }}>Vista Consolidata</Typography>

      {/* Riga filtri: [Anno] [Conto db1] [Conto db2] */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Select
          size="small"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {availableYears.map((y) => (
            <MenuItem key={y} value={y}>
              {y === 'all-years' ? 'Tutti gli anni' : y}
            </MenuItem>
          ))}
        </Select>

        {db1.ownerOptions.length > 1 && (
          <Select
            size="small"
            value={db1.selectedOwner?.id || ''}
            onChange={(e) => {
              const found = db1.ownerOptions.find((o) => o.id === e.target.value);
              if (found) db1.setSelectedOwner(found);
            }}
            sx={{ minWidth: 200 }}
          >
            {db1.ownerOptions.map((o) => (
              <MenuItem key={o.id} value={o.id}>{db1Label}: {o.name}</MenuItem>
            ))}
          </Select>
        )}

        {secondVisible && db2.ownerOptions.length > 1 && (
          <Select
            size="small"
            value={db2.selectedOwner?.id || ''}
            onChange={(e) => {
              const found = db2.ownerOptions.find((o) => o.id === e.target.value);
              if (found) db2.setSelectedOwner(found);
            }}
            sx={{ minWidth: 200 }}
          >
            {db2.ownerOptions.map((o) => (
              <MenuItem key={o.id} value={o.id}>{db2Label}: {o.name}</MenuItem>
            ))}
          </Select>
        )}
      </Stack>

      {/* Prima sezione */}
      <DbSection
        dbKey={allDbs[0]}
        dbLabel={db1Label}
        year={year}
        month={month}
        onMonthChange={setMonth}
        data={db1.data}
        loading={db1.loading}
        error={db1.error}
        selectedOwner={db1.selectedOwner}
      />

      <Divider sx={{ my: 6 }} />

      {/* Seconda sezione — lazy */}
      <Box ref={secondSectionRef}>
        {secondVisible && (
          <DbSection
            dbKey={allDbs[1]}
            dbLabel={db2Label}
            year={year}
            month={month}
            onMonthChange={setMonth}
            data={db2.data}
            loading={db2.loading}
            error={db2.error}
            selectedOwner={db2.selectedOwner}
          />
        )}
      </Box>
    </Container>
  );
}
