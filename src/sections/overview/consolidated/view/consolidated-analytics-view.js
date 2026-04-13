'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuthContext } from '../../../../auth/hooks';
import axios, { endpoints } from '../../../../utils/axios';
import MasterCategoryTable from '../master-category-table';
import MasterMonthlyTrendChart from '../master-monthly-trend-chart';

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

// ----------------------------------------------------------------------

function DbSection({ dbKey, dbLabel, year, month }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [compareYears, setCompareYears] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`${endpoints.report.master}${dbKey}`, { params: { _t: Date.now() } })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : res.data.data || [];
        setData(rows);
        const allAcc = buildAllAccountsOwner(rows);
        setSelectedOwner(allAcc || rows[0] || null);
      })
      .catch((err) => {
        console.error(`Error fetching master data for ${dbKey}:`, err);
        setError('Errore nel caricamento dei dati.');
      })
      .finally(() => setLoading(false));
  }, [dbKey]);

  const allAccountsOwner = useMemo(() => buildAllAccountsOwner(data), [data]);

  const sortedOwners = useMemo(
    () =>
      data
        .filter((o) => o.id !== 'all-accounts')
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  const ownerOptions = allAccountsOwner ? [allAccountsOwner, ...sortedOwners] : sortedOwners;

  const mainYear = year === 'all-years' ? new Date().getFullYear() : Number(year);

  const trendSeries = useMemo(() => {
    if (!selectedOwner || year === 'all-years') return [];
    const globalReport = selectedOwner.report?.globalReport;
    if (!globalReport || !globalReport[year]) return [];
    const months = globalReport[year].months || {};
    const expenseData = Array.from({ length: 12 }, (_, i) => {
      const mk = String(i + 1).padStart(2, '0');
      return parseFloat((months[mk]?.expense || 0).toFixed(2));
    });
    return [{ name: `Uscite ${year}`, data: expenseData }];
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
      {/* Header sezione con selector conto */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h5">{dbLabel}</Typography>
        {ownerOptions.length > 1 && (
          <Select
            size="small"
            value={selectedOwner?.id || ''}
            onChange={(e) => {
              const found = ownerOptions.find((o) => o.id === e.target.value);
              if (found) setSelectedOwner(found);
            }}
            sx={{ minWidth: 200 }}
          >
            {ownerOptions.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.name}
              </MenuItem>
            ))}
          </Select>
        )}
      </Stack>

      {/* Trend mensile uscite */}
      {year !== 'all-years' && trendSeries.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <MasterMonthlyTrendChart
            title="Andamento mensile uscite"
            subheader={`Media spese mensili per l'anno ${year}`}
            series={trendSeries}
            categories={MONTHS_LABELS}
            onBarClick={() => {}}
          />
        </Box>
      )}

      {/* Tabella categorie */}
      {selectedOwner && (
        <MasterCategoryTable
          data={data}
          mainYear={mainYear}
          owner={selectedOwner}
          selectedMonth={month}
          onMonthChange={() => {}}
          onCompareYearsChange={setCompareYears}
        />
      )}
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

  // Lazy load della seconda sezione
  const secondSectionRef = useRef(null);
  const [secondVisible, setSecondVisible] = useState(false);

  useEffect(() => {
    if (!secondSectionRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSecondVisible(true);
      },
      { rootMargin: '200px' }
    );
    observer.observe(secondSectionRef.current);
    return () => observer.disconnect();
  }, []);

  if (!user || allDbs.length < 2) return null;

  return (
    <Container maxWidth="xl">
      {/* Header con selettori condivisi */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Typography variant="h4">Vista Consolidata</Typography>
        <Stack direction="row" spacing={2}>
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
          <Select
            size="small"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            sx={{ minWidth: 130 }}
          >
            {MONTHS_LABELS.map((label, idx) => (
              // eslint-disable-next-line react/no-array-index-key
              <MenuItem key={idx + 1} value={idx + 1}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>

      {/* Prima sezione — primo db (sempre caricata) */}
      <DbSection
        dbKey={allDbs[0]}
        dbLabel={allDbs[0] === 'db1' ? 'Guido' : allDbs[0]}
        year={year}
        month={month}
      />

      <Divider sx={{ my: 6 }} />

      {/* Seconda sezione — secondo db (lazy) */}
      <Box ref={secondSectionRef}>
        {secondVisible && (
          <DbSection
            dbKey={allDbs[1]}
            dbLabel={allDbs[1] === 'db2' ? 'Marta' : allDbs[1]}
            year={year}
            month={month}
          />
        )}
      </Box>
    </Container>
  );
}
