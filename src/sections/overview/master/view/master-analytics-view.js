'use client';

import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useSettingsContext } from 'src/components/settings';

import MasterTransaction from '../master-transaction';
import axios, { endpoints } from '../../../../utils/axios';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import AnalyticsCurrentVisits from '../../analytics/analytics-current-visits';
import { paths } from '../../../../routes/paths';
import { useRouter } from '../../../../routes/hooks';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

export default function MasterAnalyticsView() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const settings = useSettingsContext();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(endpoints.report.master, { params: { db: settings.db } });
        setData(response.data.data);
        if (!settings.owner) {
          settings.onChangeOwner(response.data.data[0]);
        }
        if (!settings.year) {
          settings.onChangeYear(response.data.data[0].report.years[0]);
        }
      } catch (error) {
        console.error('Error fetching master data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYearChange = (event) => {
    settings.onChangeYear(event.target.value);
  };

  const handleOwnerChange = (event) => {
    const selectedOwner = data.find((owner) => owner.id === event.target.value);
    settings.onChangeOwner(selectedOwner);
  };

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.master.category.details({ id }));
    },
    [router]
  );

  const getCurrentBalance = () => {
    // Se non ci sono dati o non è selezionato un proprietario, restituisce valori di default
    if (!data || !data.length || !settings.owner) {
      console.log('Nessun dato o proprietario selezionato');
      return { balance: 0, lastUpdate: new Date(), percentChange: 0, description: 'Nessun dato disponibile' };
    }

    const owner = settings.owner;
    
    // Controllo e conversione dei valori numerici
    const initialBalance = owner.initialBalance ? parseFloat(owner.initialBalance) : 0;
    const balanceDate = owner.balanceDate ? new Date(owner.balanceDate) : null;
    
    console.log('Dati saldo:', { initialBalance, balanceDate, owner });

    // Poiché non abbiamo saldo iniziale nei dati, calcoliamo il saldo come entrate - uscite
    // per tutti gli anni disponibili fino all'anno selezionato
    const currentYear = parseInt(settings.year, 10);
    
    // Ottieni tutti gli anni disponibili e ordinali
    const availableYears = Object.keys(owner.report.globalReport).map(y => parseInt(y, 10)).sort();
    
    let totalIncome = 0;
    let totalExpense = 0;
    let lastTransaction = new Date();
    let previousYearTotalIncome = 0;
    let previousYearTotalExpense = 0;
    
    // Calcola il saldo per tutti gli anni fino all'anno corrente
    availableYears.forEach(year => {
      if (year <= currentYear) {
        const yearReport = owner.report.globalReport[year.toString()];
        
        if (yearReport) {
          const yearIncome = parseFloat(yearReport.income) || 0;
          const yearExpense = parseFloat(yearReport.expense) || 0;
          
          totalIncome += yearIncome;
          totalExpense += yearExpense;
          
          // Se è l'anno corrente, trova l'ultimo mese con transazioni
          if (year === currentYear) {
            const sortedMonths = Object.entries(yearReport.months)
              .sort(([a], [b]) => parseInt(b, 10) - parseInt(a, 10));
            
            if (sortedMonths.length > 0) {
              const lastMonth = parseInt(sortedMonths[0][0], 10);
              lastTransaction = new Date(year, lastMonth - 1, 28); // Impostiamo al 28 del mese
            }
          }
          
          // Tieni traccia delle entrate e uscite fino all'anno precedente
          if (year < currentYear) {
            previousYearTotalIncome += yearIncome;
            previousYearTotalExpense += yearExpense;
          }
        }
      }
    });
    
    // Calcola il saldo corrente e precedente
    const currentBalance = initialBalance + totalIncome - totalExpense;
    const previousYearBalance = initialBalance + previousYearTotalIncome - previousYearTotalExpense;
    
    console.log('Calcolo saldo finale:', { 
      initialBalance, 
      totalIncome, 
      totalExpense, 
      currentBalance,
      previousYearBalance
    });
    
    // Calcolo della variazione percentuale rispetto all'anno precedente
    let percentChange = 0;
    if (previousYearBalance !== 0) {
      percentChange = ((currentBalance - previousYearBalance) / Math.abs(previousYearBalance)) * 100;
    }

    // Verifica se è disponibile l'anno corrente
    const currentYearData = owner.report.globalReport[currentYear.toString()];
    const description = currentYearData 
      ? `Saldo aggiornato al ${lastTransaction.toLocaleDateString()}` 
      : `Saldo calcolato in base alle transazioni fino al ${lastTransaction.getFullYear()}`;

    return {
      balance: currentBalance,
      lastUpdate: lastTransaction,
      percentChange,
      description
    };
  };

  const getGlobalIncome = () => {
    const selectedReport = settings.owner?.report?.globalReport[settings.year];

    if (!selectedReport) return { incomeData: [], totalIncome: 0, percentChange: 0 };

    // Ordiniamo i mesi
    const sortedMonths = Object.entries(selectedReport.months).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    const incomeData = sortedMonths.map(([month, date]) => ({
      x: `${settings.year}-${month.padStart(2, '0')}`, // Formato YYYY-MM
      y: date.income,
    }));

    const totalIncome = selectedReport?.income || 0;

    // Calcolo variazione percentuale rispetto al mese precedente
    let percentChange = 0;
    if (sortedMonths.length > 1) {
      const lastMonthIncome = sortedMonths[sortedMonths.length - 1][1].income; // Income dell'ultimo mese
      const prevMonthIncome = sortedMonths[sortedMonths.length - 2][1].income; // Income del mese precedente

      if (prevMonthIncome !== 0) {
        percentChange = ((lastMonthIncome - prevMonthIncome) / prevMonthIncome) * 100;
      }
    }

    return { incomeData, totalIncome, percentChange };
  };

  const getGlobalExpense = () => {
    const selectedReport = settings.owner?.report?.globalReport[settings.year];

    if (!selectedReport) return { expenseData: [], totalExpense: 0, percentChange: 0 };

    // Ordiniamo i mesi
    const sortedMonths = Object.entries(selectedReport.months).sort(
      ([a], [b]) => Number(a) - Number(b)
    );

    const expenseData = sortedMonths.map(([month, date]) => ({
      x: `${settings.year}-${month.padStart(2, '0')}`, // Formato YYYY-MM
      y: date.expense,
    }));

    const totalExpense = selectedReport?.expense || 0;

    // Calcolo variazione percentuale rispetto al mese precedente
    let percentChange = 0;
    if (sortedMonths.length > 1) {
      const lastMonthExpense = sortedMonths[sortedMonths.length - 1][1].expense; // Spesa dell'ultimo mese
      const prevMonthExpense = sortedMonths[sortedMonths.length - 2][1].expense; // Spesa del mese precedente

      if (prevMonthExpense !== 0) {
        percentChange = ((lastMonthExpense - prevMonthExpense) / prevMonthExpense) * 100;
      }
    }

    return { expenseData, totalExpense, percentChange };
  };

  const getCategorySummary = () => {
    if (!data || !settings.owner || !settings.year) return [];

    // Trova i dati corrispondenti all'owner selezionato
    const selectedOwner = data.find((owner) => owner.id === settings.owner.id);
    if (!selectedOwner) return [];

    // Prende il report dal dataset caricato
    const selectedReport = selectedOwner.report?.categoryReport[settings.year];
    if (!selectedReport) return [];

    return Object.entries(selectedReport).map(([category, values]) => {
      const totalExpense = values.totalExpense || 0;
      const monthsWithExpense = Object.values(values.months).filter(
        (month) => month.expense > 0
      ).length;
      const averageCost = monthsWithExpense > 0 ? totalExpense / monthsWithExpense : 0;

      return {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        category: values.name,
        income: values.totalIncome,
        expense: values.totalExpense,
        difference: values.totalIncome - values.totalExpense,
        averageCost,
      };
    });
  };

  const getChartData = () => {
    if (!data || !settings.year) return [];

    // Trova l'owner selezionato
    const selectedOwner = data.find((owner) => owner.id === settings.owner.id);
    if (!selectedOwner) return [];

    const globalReport = selectedOwner.report?.globalReport;
    if (!globalReport) return [];

    const currentYear = settings.year; // Anno selezionato
    const previousYear = (parseInt(settings.year, 10) - 1).toString(); // Anno precedente

    // Funzione per estrarre i dati mensili per un determinato anno
    const extractMonthlyData = (year) => {
      const months = globalReport[year]?.months || {};
      return Array.from({ length: 12 }, (_, i) => {
        const monthKey = (i + 1).toString().padStart(2, '0'); // Formatta 01, 02, ..., 12
        return {
          income: months[monthKey]?.income || 0,
          expense: months[monthKey]?.expense || 0,
        };
      });
    };

    const monthlyDataCurrentYear = extractMonthlyData(currentYear);
    const monthlyDataPreviousYear = extractMonthlyData(previousYear);

    return [
      {
        name: `Entrate ${currentYear}`,
        data: monthlyDataCurrentYear.map((m) => m.income),
      },
      {
        name: `Uscite ${currentYear}`,
        data: monthlyDataCurrentYear.map((m) => m.expense),
      },
      {
        name: `Entrate ${previousYear}`,
        data: monthlyDataPreviousYear.map((m) => m.income),
      },
      {
        name: `Uscite ${previousYear}`,
        data: monthlyDataPreviousYear.map((m) => m.expense),
      },
    ];
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack
        divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}
        spacing={3}
        sx={{ mb: 5 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Stack direction="column" spacing={3}>
            <Typography variant="h4" component="div">
              Francesco
            </Typography>

            {data && settings.owner && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" component="div">
                  Riepilogo spese per categoria dell&#39;anno
                </Typography>
                <Select
                  id="current-year"
                  label="Anno"
                  onChange={handleYearChange}
                  defaultValue={settings.year}
                  variant="standard"
                  sx={{
                    width: 65,
                  }}
                >
                  {settings.owner.report.years.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="body1" component="div">
                  relativo al conto
                </Typography>
                <Select
                  id="current-owner"
                  label="Conto corrente"
                  onChange={handleOwnerChange}
                  defaultValue={settings.owner.id}
                  variant="standard"
                  sx={{
                    width: '700',
                  }}
                >
                  {data.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name} | {option.cc}{' '}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
      {data && settings.owner ? (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <BankingWidgetSummary
                title="Saldo corrente"
                icon="solar:wallet-money-bold"
                percent={getCurrentBalance().percentChange}
                total={getCurrentBalance().balance}
                description={getCurrentBalance().description}
                color="info"
                chart={{ series: [] }}  // Non mostriamo il grafico per il saldo
                sx={{
                  '&::before, &::after': {
                    backgroundColor: (theme) => theme.palette.info.lighter,
                  },
                  boxShadow: (theme) => `0 4px 12px ${theme.palette.info.lighter}`,
                }}
              />
            
              <BankingWidgetSummary
                title="Entrate"
                icon="eva:diagonal-arrow-left-down-fill"
                percent={getGlobalIncome().percentChange}
                total={getGlobalIncome().totalIncome}
                chart={{ series: getGlobalIncome().incomeData }}
              />

              <BankingWidgetSummary
                title="Uscite"
                color="warning"
                icon="eva:diagonal-arrow-right-up-fill"
                percent={getGlobalExpense().percentChange}
                total={getGlobalExpense().totalExpense}
                chart={{ series: getGlobalExpense().expenseData }}
              />
            </Stack>
          </Grid>
          <Grid size={12}>
            <Stack direction="column" spacing={3}>
              <Grid size={12}>
                <MasterTransaction
                  title="Riepilogo per categorie"
                  handleViewRow={handleViewRow}
                  tableData={getCategorySummary()} // Dati riepilogativi delle categorie
                  tableLabels={[
                    { id: 'category', label: 'Categoria' },
                    { id: 'income', label: 'Entrate (€)', align: 'right' },
                    { id: 'expense', label: 'Uscite (€)', align: 'right' },
                    { id: 'averageCost', label: 'Media spese mensile (€)', align: 'right' },
                    { id: 'difference', label: 'Delta annuale (€)', align: 'right' },
                  ]}
                />
              </Grid>
            </Stack>
          </Grid>
          <Grid size={12}>
            <ChartColumnMultiple
              title="Entrate/Uscite per anno"
              categories={[
                'Gen',
                'Feb',
                'Mar',
                'Apr',
                'Mag',
                'Giu',
                'Lug',
                'Ago',
                'Set',
                'Ott',
                'Nov',
                'Dic',
              ]}
              series={getChartData()}
            />
          </Grid>
          <Grid size={4}>
            <AnalyticsCurrentVisits
              title="Entrate/uscite"
              chart={{
                series: [
                  { label: 'Entrate', value: getGlobalIncome().totalIncome },
                  { label: 'Uscite', value: getGlobalExpense().totalExpense },
                ],
              }}
            />
          </Grid>
        </Grid>
      ) : (
        <Typography variant="h6">
          Non sono ancora disponibili dati sufficienti per generare il report
        </Typography>
      )}
    </Container>
  );
}
