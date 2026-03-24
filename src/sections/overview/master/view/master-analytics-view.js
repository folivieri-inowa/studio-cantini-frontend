'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuthContext } from '../../../../auth/hooks';
import axios, { endpoints } from '../../../../utils/axios';
import { useSettingsContext } from '../../../../components/settings';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import CategoryChartToggle from '../../category/category-chart-toggle';
import MasterMonthlyTrendChart from '../master-monthly-trend-chart';
import MasterCategoryTable from '../master-category-table';

// ----------------------------------------------------------------------

function deriveSelectedMonth(settingsYear, realYear, realMonth) {
  const resolvedYear = settingsYear === 'all-years' ? realYear : Number(settingsYear);
  return resolvedYear >= realYear ? realMonth : 12;
}

export default function MasterAnalyticsView() {
  const [data, setData] = useState([]);
  const settings = useSettingsContext();
  const { user } = useAuthContext();
  
  // Ordina alfabeticamente i conti correnti e filtra l'eventuale 'all-accounts' dal backend
  const sortedData = useMemo(() => 
    data ? data.slice()
      .filter(owner => owner.id !== 'all-accounts') // Rimuovi duplicato 'Tutti i conti'
      .sort((a, b) => a.name.localeCompare(b.name)) : []
  , [data]);
  
  // Crea l'oggetto "all-accounts" una sola volta quando i dati cambiano
  const allAccountsOwner = useMemo(() => {
    if (!data || data.length === 0) return null;
    
    const allAccounts = {
      id: 'all-accounts',
      name: 'Tutti i conti',
      cc: '',
      iban: '',
      initialBalance: 0,
      balanceDate: null,
      report: {
        years: [],
        globalReport: {},
        categoryReport: {},
      },
    };

    // Filtriamo gli owner escludendo le carte di credito
    const nonCreditCardOwners = data.filter(owner => owner.id !== 'all-accounts' && !owner.isCreditCard);

    // Collect all available years
    const allYears = new Set();
    nonCreditCardOwners.forEach(owner => {
      owner.report?.years?.forEach(year => allYears.add(year));
    });
    allAccounts.report.years = Array.from(allYears).sort((a, b) => b - a);

    // For each year, combine the reports
    allAccounts.report.years.forEach(year => {
      allAccounts.report.globalReport[year] = { income: 0, expense: 0, months: {} };

      // Initialize months
      for (let month = 1; month <= 12; month += 1) {
        const monthKey = month.toString().padStart(2, '0');
        allAccounts.report.globalReport[year].months[monthKey] = { income: 0, expense: 0 };
      }

      // Combine data from owners
      nonCreditCardOwners.forEach(owner => {
        const ownerReport = owner.report?.globalReport?.[year];
        if (ownerReport) {
          allAccounts.report.globalReport[year].income += parseFloat(ownerReport.income || 0);
          allAccounts.report.globalReport[year].expense += parseFloat(ownerReport.expense || 0);

          Object.entries(ownerReport.months || {}).forEach(([month, monthData]) => {
            if (!allAccounts.report.globalReport[year].months[month]) {
              allAccounts.report.globalReport[year].months[month] = { income: 0, expense: 0 };
            }
            allAccounts.report.globalReport[year].months[month].income += parseFloat(monthData.income || 0);
            allAccounts.report.globalReport[year].months[month].expense += parseFloat(monthData.expense || 0);
          });
        }
      });

      // Round values
      allAccounts.report.globalReport[year].income = parseFloat(allAccounts.report.globalReport[year].income.toFixed(2));
      allAccounts.report.globalReport[year].expense = parseFloat(allAccounts.report.globalReport[year].expense.toFixed(2));

      Object.keys(allAccounts.report.globalReport[year].months).forEach(month => {
        allAccounts.report.globalReport[year].months[month].income = parseFloat(allAccounts.report.globalReport[year].months[month].income.toFixed(2));
        allAccounts.report.globalReport[year].months[month].expense = parseFloat(allAccounts.report.globalReport[year].months[month].expense.toFixed(2));
      });

      // Combine category reports
      allAccounts.report.categoryReport[year] = {};

      // Get all unique categories
      const allCategories = new Set();
      nonCreditCardOwners.forEach(owner => {
        const categoryReport = owner.report?.categoryReport?.[year];
        if (categoryReport) {
          Object.keys(categoryReport).forEach(categoryId => allCategories.add(categoryId));
        }
      });

      // Combine category data
      allCategories.forEach(categoryId => {
        allAccounts.report.categoryReport[year][categoryId] = {
          id: categoryId,
          name: '',
          totalIncome: 0,
          totalExpense: 0,
          months: {},
        };

        // Initialize months
        for (let month = 1; month <= 12; month += 1) {
          const monthKey = month.toString().padStart(2, '0');
          allAccounts.report.categoryReport[year][categoryId].months[monthKey] = { income: 0, expense: 0 };
        }

        // Combine data from owners
        nonCreditCardOwners.forEach(owner => {
          const categoryReport = owner.report?.categoryReport?.[year];
          if (categoryReport && categoryReport[categoryId]) {
            // Set category name if not already set
            if (!allAccounts.report.categoryReport[year][categoryId].name) {
              allAccounts.report.categoryReport[year][categoryId].name = categoryReport[categoryId].name;
            }

            // Add to yearly totals
            allAccounts.report.categoryReport[year][categoryId].totalIncome += parseFloat(categoryReport[categoryId].totalIncome || 0);
            allAccounts.report.categoryReport[year][categoryId].totalExpense += parseFloat(categoryReport[categoryId].totalExpense || 0);

            // Add to monthly totals
            Object.entries(categoryReport[categoryId].months || {}).forEach(([month, monthData]) => {
              if (!allAccounts.report.categoryReport[year][categoryId].months[month]) {
                allAccounts.report.categoryReport[year][categoryId].months[month] = { income: 0, expense: 0 };
              }
              allAccounts.report.categoryReport[year][categoryId].months[month].income += parseFloat(monthData.income || 0);
              allAccounts.report.categoryReport[year][categoryId].months[month].expense += parseFloat(monthData.expense || 0);
            });
          }
        });

        // Round values
        allAccounts.report.categoryReport[year][categoryId].totalIncome = parseFloat(allAccounts.report.categoryReport[year][categoryId].totalIncome.toFixed(2));
        allAccounts.report.categoryReport[year][categoryId].totalExpense = parseFloat(allAccounts.report.categoryReport[year][categoryId].totalExpense.toFixed(2));

        Object.keys(allAccounts.report.categoryReport[year][categoryId].months).forEach(month => {
          allAccounts.report.categoryReport[year][categoryId].months[month].income = parseFloat(allAccounts.report.categoryReport[year][categoryId].months[month].income.toFixed(2));
          allAccounts.report.categoryReport[year][categoryId].months[month].expense = parseFloat(allAccounts.report.categoryReport[year][categoryId].months[month].expense.toFixed(2));
        });
      });
    });

    return allAccounts;
  }, [data]);

  const availableYears = useMemo(() => {
    if (!data || data.length === 0) return [];
    const years = new Set();
    data.forEach(ownerItem => {
      ownerItem.report?.years?.forEach(y => years.add(y));
    });
    const sorted = Array.from(years).sort((a, b) => b - a);
    return ['all-years', ...sorted];
  }, [data]);

  // Stato per lo Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const _now = new Date();
  const currentRealYear = _now.getFullYear();
  const currentRealMonth = _now.getMonth() + 1;

  const [selectedMonth, setSelectedMonth] = useState(
    () => deriveSelectedMonth(settings.year, currentRealYear, currentRealMonth)
  );

  const MONTHS_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  const selectedMonthLabel = MONTHS_LABELS[selectedMonth - 1] ?? '';

  // Funzione per caricare i dati dal server
  const fetchData = async () => {
    try {
      // Aggiungiamo un timestamp come parametro per evitare la cache
      const timestamp = new Date().getTime();
      // Il backend usa path parameter: /api/report/master/:db
      const response = await axios.get(`${endpoints.report.master}${settings.db}`, {
        params: {
          _t: timestamp
        }
      });

      // Il backend restituisce un array direttamente
      const responseData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const fetchedData = responseData;
      setData(fetchedData);

      // Aggiorna l'owner corrente se esiste, altrimenti imposta il primo della lista
      if (settings.owner && fetchedData.length > 0) {
        // Trova l'owner corrispondente nei nuovi dati
        const currentOwner = fetchedData.find(owner => owner.id === settings.owner.id);
        if (currentOwner) {
          // Aggiorna l'owner con i dati freschi
          settings.onChangeOwner(currentOwner);
        }
      } else if (fetchedData.length > 0) {
        // Se non c'è un owner selezionato, imposta il primo
        settings.onChangeOwner(fetchedData[0]);
      }

      // Solo se non c'è ancora un anno selezionato, impostiamo il primo anno disponibile
      if (!settings.year && fetchedData.length > 0 && fetchedData[0].report?.years?.length) {
        settings.onChangeYear(fetchedData[0].report.years[0]);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  useEffect(() => {
    // Carica i dati all'avvio e quando cambia il database
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.db]); // Riesegui quando cambia il database

  // currentRealYear e currentRealMonth sono primitivi numerici costanti per la sessione
  useEffect(() => {
    setSelectedMonth(deriveSelectedMonth(settings.year, currentRealYear, currentRealMonth));
  }, [settings.year, currentRealYear, currentRealMonth]);

  const handleYearChange = useCallback((event) => {
    const newYear = event.target.value;
    const currentOwnerId = settings.owner?.id;

    // "all-years" è un valore speciale per visualizzare tutti i dati storici
    // Non richiede validazione perché viene gestito dalle funzioni di aggregazione
    if (newYear === 'all-years') {
      settings.onChangeYear(newYear);
      return;
    }

    // Se siamo nel caso "Tutti i conti", non abbiamo bisogno di verificare l'anno
    if (currentOwnerId === 'all-accounts') {
      settings.onChangeYear(newYear);
      return;
    }

    // Controlla se il conto corrente ha dati per l'anno selezionato
    const currentOwner = data.find(owner => owner.id === currentOwnerId);

    if (currentOwner && currentOwner.report) {
      const hasDataForYear = currentOwner.report.globalReport && currentOwner.report.globalReport[newYear];

      if (!hasDataForYear) {
        // Mostra un avviso all'utente che il conto non ha dati per quell'anno
        setSnackbar({
          open: true,
          message: `Il conto corrente selezionato non ha dati per l'anno ${newYear}.`,
          severity: 'warning'
        });
      }
    }

    settings.onChangeYear(newYear);
  }, [data, settings, setSnackbar]);

  const handleOwnerChange = useCallback((event) => {
    const selectedValue = event.target.value;

    if (selectedValue === 'all-accounts') {
      // Usa l'oggetto all-accounts già memoizzato
      if (!allAccountsOwner) {
        console.error('allAccountsOwner non disponibile');
        return;
      }

      // Usa l'oggetto memoizzato invece di ricrearlo
      settings.onChangeOwner(allAccountsOwner);
    } else {
      // Handle normal owner selection - qui NON filtriamo in base a isCreditCard
      const selectedOwner = data.find((owner) => owner.id === selectedValue);

      // Verifica se l'anno attualmente selezionato è disponibile per questo conto
      const currentYear = settings.year;
      const availableYears = selectedOwner.report?.years || [];

      // Se l'anno corrente non è disponibile e ci sono anni disponibili, seleziona il primo disponibile
      if (availableYears.length > 0 && !availableYears.includes(currentYear)) {
        // Seleziona il primo anno disponibile (solitamente il più recente)
        const firstAvailableYear = availableYears[0];

        // Mostra il messaggio all'utente
        setSnackbar({
          open: true,
          message: `L'anno ${currentYear} non ha dati per il conto selezionato. È stato selezionato automaticamente l'anno ${firstAvailableYear}.`,
          severity: 'info'
        });

        // Aggiorna prima l'owner e poi l'anno per evitare problemi di rendering
        settings.onChangeOwner(selectedOwner);
        settings.onChangeYear(firstAvailableYear);
      } else {
        // L'anno corrente è disponibile, aggiorna solo l'owner
        settings.onChangeOwner(selectedOwner);
      }
    }
  }, [data, settings, allAccountsOwner, setSnackbar]);

  // Funzione per chiudere lo Snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleMonthChange = useCallback((month) => {
    if (month >= 1 && month <= 12) {
      setSelectedMonth(month);
    }
  }, []);

  const getCurrentBalance = () => {
    // Se non ci sono dati o non è selezionato un proprietario, restituisce valori di default
    if (!data || !data.length || !settings.owner) {
      // Nessun dato
      return { balance: 0, lastUpdate: new Date(), percentChange: 0, description: 'Nessun dato disponibile' };
    }

    const { owner } = settings;

    // Controllo e conversione dei valori numerici
    const initialBalance = owner.initialBalance ? parseFloat(owner.initialBalance) : 0;
    const balanceDate = owner.balanceDate ? new Date(owner.balanceDate) : null;

    // Calcoliamo il saldo come: saldo iniziale + entrate - uscite
    // per tutti gli anni disponibili fino all'anno selezionato
    
    // Ottieni tutti gli anni disponibili e ordinali
    if (!owner.report?.globalReport) {
      return { balance: 0, lastUpdate: new Date(), percentChange: 0, description: 'Nessun dato disponibile' };
    }
    const availableYears = Object.keys(owner.report.globalReport).map(y => parseInt(y, 10)).sort();
    
    // Per 'all-years' usiamo l'ultimo anno disponibile, altrimenti l'anno selezionato
    const currentYear = settings.year === 'all-years' 
      ? availableYears[availableYears.length - 1] 
      : parseInt(settings.year, 10);

    let totalIncome = 0;
    let totalExpense = 0;
    // Inizializziamo lastTransaction a una data molto vecchia per consentire l'aggiornamento
    let lastTransaction = new Date(2000, 0, 1);
    let previousYearTotalIncome = 0;
    let previousYearTotalExpense = 0;

    // Calcola il saldo per tutti gli anni fino all'anno corrente
    availableYears.forEach(year => {
      if (year <= currentYear) {
        const yearReport = owner.report.globalReport[year.toString()];

        if (yearReport) {
          // Arrotondiamo a due decimali per evitare problemi di precisione
          const yearIncome = parseFloat(parseFloat(yearReport.income || 0).toFixed(2));
          const yearExpense = parseFloat(parseFloat(yearReport.expense || 0).toFixed(2));

          totalIncome += yearIncome;
          totalExpense += yearExpense;

          // Controlliamo tutti gli anni disponibili per trovare l'ultima transazione
          // Ordiniamo i mesi in ordine CRESCENTE per analizzare tutti i mesi
          const sortedMonths = Object.entries(yearReport.months)
            .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));

          // Troviamo l'ultimo mese con importi di entrata o uscita
          const lastMonth = sortedMonths.reduce((lastMonthValue, [month, monthData]) => {
            const monthNum = parseInt(month, 10);
            // Consideriamo un mese rilevante solo se ha entrate o uscite
            return (monthData.income > 0 || monthData.expense > 0)
              ? Math.max(lastMonthValue, monthNum)
              : lastMonthValue;
          }, 0);

          // Se abbiamo trovato un mese valido, aggiorniamo lastTransaction solo se è più recente
          if (lastMonth > 0) {
            // Per ottenere l'ultimo giorno del mese, usiamo il giorno 0 del mese successivo
            const lastDay = new Date(year, lastMonth, 0).getDate();
            const newDate = new Date(year, lastMonth - 1, lastDay);

            // Aggiorniamo lastTransaction solo se questa data è più recente
            if (newDate > lastTransaction) {
              lastTransaction = newDate;
              // Data aggiornamento saldo
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

    // Arrotonda i calcoli a 2 decimali per maggiore precisione
    const roundedTotalIncome = parseFloat(totalIncome.toFixed(2));
    const roundedTotalExpense = parseFloat(totalExpense.toFixed(2));
    const roundedInitialBalance = parseFloat(initialBalance.toFixed(2));

    // Calcola il saldo corrente e precedente
    const currentBalance = parseFloat((roundedInitialBalance + roundedTotalIncome - roundedTotalExpense).toFixed(2));

    const roundedPreviousIncome = parseFloat(previousYearTotalIncome.toFixed(2));
    const roundedPreviousExpense = parseFloat(previousYearTotalExpense.toFixed(2));
    const previousYearBalance = parseFloat((roundedInitialBalance + roundedPreviousIncome - roundedPreviousExpense).toFixed(2));

    // Calcolo della variazione percentuale rispetto all'anno precedente
    let percentChange = 0;
    if (previousYearBalance !== 0) {
      percentChange = parseFloat(((currentBalance - previousYearBalance) / Math.abs(previousYearBalance) * 100).toFixed(2));
    }

    // Verifica se è disponibile l'anno corrente
    const currentYearData = owner.report.globalReport[currentYear.toString()];

    // Formatta la data in modo leggibile (es: 8 maggio 2025)
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = lastTransaction.toLocaleDateString('it-IT', options);

    const description = currentYearData
      ? `Saldo aggiornato al ${formattedDate}`
      : `Saldo calcolato in base alle transazioni fino al ${lastTransaction.getFullYear()}`;

    // Descrizione saldo

    return {
      balance: currentBalance,
      lastUpdate: lastTransaction,
      percentChange,
      description
    };
  };

  const getGlobalIncome = () => {
    if (!settings?.owner) return { incomeData: [], totalIncome: 0, percentChange: 0 };
    const globalReport = settings.owner?.report?.globalReport;
    if (!globalReport) return { incomeData: [], totalIncome: 0, percentChange: 0 };

    const isAllYears = settings.year === 'all-years';
    const yearsToProcess = isAllYears ? (settings.owner.report?.years || []) : [settings.year];

    if (!isAllYears) {
      // Logica originale per un singolo anno
      const selectedReport = globalReport[settings.year];
      if (!selectedReport) return { incomeData: [], totalIncome: 0, percentChange: 0 };

      const sortedMonths = Object.entries(selectedReport.months).sort(
        ([a], [b]) => Number(a) - Number(b)
      );

      const filteredMonths = sortedMonths.filter(([month]) => Number(month) <= selectedMonth);

      const incomeData = filteredMonths.map(([month, date]) => ({
        x: `${settings.year}-${month.padStart(2, '0')}`,
        y: parseFloat((date?.income ?? 0).toFixed(2)),
      }));

      // Ricalcola totalIncome solo per i mesi filtrati
      const totalIncome = parseFloat(
        filteredMonths.reduce((sum, [, date]) => sum + (date?.income ?? 0), 0).toFixed(2)
      );

      let percentChange = 0;
      const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
      if (prevYearReport) {
        const prevFilteredMonths = Object.entries(prevYearReport.months)
          .filter(([month]) => Number(month) <= selectedMonth);
        const prevYearIncome = parseFloat(
          prevFilteredMonths.reduce((sum, [, m]) => sum + (m?.income ?? 0), 0).toFixed(2)
        );
        if (prevYearIncome !== 0) {
          percentChange = parseFloat(((totalIncome - prevYearIncome) / prevYearIncome * 100).toFixed(2));
        }
      }

      return { incomeData, totalIncome, percentChange };
    }

    // Aggregazione multi-anno per 'all-years'
    const allMonthsData = [];
    let totalIncome = 0;

    yearsToProcess.sort().forEach(year => {
      const yearReport = globalReport[year];
      if (!yearReport) return;

      const sortedMonths = Object.entries(yearReport.months).sort(
        ([a], [b]) => Number(a) - Number(b)
      );

      const filteredMonths = sortedMonths;

      filteredMonths.forEach(([month, date]) => {
        const monthIncome = parseFloat(date?.income ?? 0);
        totalIncome += monthIncome;
        allMonthsData.push({
          x: `${year}-${month.padStart(2, '0')}`,
          y: parseFloat(monthIncome.toFixed(2)),
        });
      });
    });

    // Calcolo percentuale di crescita tra primo e ultimo mese del periodo
    let percentChange = 0;
    if (allMonthsData.length > 1) {
      const firstMonthIncome = allMonthsData[0].y;
      const lastMonthIncome = allMonthsData[allMonthsData.length - 1].y;
      if (firstMonthIncome !== 0) {
        percentChange = parseFloat(((lastMonthIncome - firstMonthIncome) / firstMonthIncome * 100).toFixed(2));
      }
    }

    return { 
      incomeData: allMonthsData, 
      totalIncome: parseFloat(totalIncome.toFixed(2)), 
      percentChange 
    };
  };

  const getGlobalExpense = () => {
    if (!settings?.owner) return { expenseData: [], totalExpense: 0, percentChange: 0 };
    const globalReport = settings.owner?.report?.globalReport;
    if (!globalReport) return { expenseData: [], totalExpense: 0, percentChange: 0 };

    const isAllYears = settings.year === 'all-years';
    const yearsToProcess = isAllYears ? (settings.owner.report?.years || []) : [settings.year];

    if (!isAllYears) {
      // Logica originale per un singolo anno
      const selectedReport = globalReport[settings.year];
      if (!selectedReport) return { expenseData: [], totalExpense: 0, percentChange: 0 };

      const sortedMonths = Object.entries(selectedReport.months).sort(
        ([a], [b]) => Number(a) - Number(b)
      );

      const filteredMonths = sortedMonths.filter(([month]) => Number(month) <= selectedMonth);

      const expenseData = filteredMonths.map(([month, date]) => ({
        x: `${settings.year}-${month.padStart(2, '0')}`,
        y: parseFloat((date?.expense ?? 0).toFixed(2)),
      }));

      // Ricalcola totalExpense solo per i mesi filtrati
      const totalExpense = parseFloat(
        filteredMonths.reduce((sum, [, date]) => sum + (date?.expense ?? 0), 0).toFixed(2)
      );

      let percentChange = 0;
      const prevYearReport = globalReport[parseInt(settings.year, 10) - 1];
      if (prevYearReport) {
        const prevFilteredMonths = Object.entries(prevYearReport.months)
          .filter(([month]) => Number(month) <= selectedMonth);
        const prevYearExpense = parseFloat(
          prevFilteredMonths.reduce((sum, [, m]) => sum + (m?.expense ?? 0), 0).toFixed(2)
        );
        if (prevYearExpense !== 0) {
          percentChange = parseFloat(((totalExpense - prevYearExpense) / prevYearExpense * 100).toFixed(2));
        }
      }

      return { expenseData, totalExpense, percentChange };
    }

    // Aggregazione multi-anno per 'all-years'
    const allMonthsData = [];
    let totalExpense = 0;

    yearsToProcess.sort().forEach(year => {
      const yearReport = globalReport[year];
      if (!yearReport) return;

      const sortedMonths = Object.entries(yearReport.months).sort(
        ([a], [b]) => Number(a) - Number(b)
      );

      const filteredMonths = sortedMonths;

      filteredMonths.forEach(([month, date]) => {
        const monthExpense = parseFloat(date?.expense ?? 0);
        totalExpense += monthExpense;
        allMonthsData.push({
          x: `${year}-${month.padStart(2, '0')}`,
          y: parseFloat(monthExpense.toFixed(2)),
        });
      });
    });

    // Calcolo percentuale di crescita tra primo e ultimo mese del periodo
    let percentChange = 0;
    if (allMonthsData.length > 1) {
      const firstMonthExpense = allMonthsData[0].y;
      const lastMonthExpense = allMonthsData[allMonthsData.length - 1].y;
      if (firstMonthExpense !== 0) {
        percentChange = parseFloat(((lastMonthExpense - firstMonthExpense) / firstMonthExpense * 100).toFixed(2));
      }
    }

    return {
      expenseData: allMonthsData,
      totalExpense: parseFloat(totalExpense.toFixed(2)),
      percentChange
    };
  };

  const getMultiYearAreaData = () => {
    const globalReport = settings.owner?.report?.globalReport;
    if (!globalReport) return { categories: [], series: [], colors: [] };

    const years = (settings.owner.report?.years || []).slice().sort();

    // Palette colori per anno: entrate, uscite
    const yearColors = [
      ['#4ADDDE', '#F45757'],
      ['#22C55E', '#F97316'],
      ['#A855F7', '#EAB308'],
      ['#3B82F6', '#EC4899'],
      ['#14B8A6', '#F43F5E'],
    ];

    const categories = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

    const series = years.flatMap((year) => {
      const yearReport = globalReport[year];
      const months = yearReport?.months || {};
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const monthKey = (i + 1).toString().padStart(2, '0');
        return {
          income: parseFloat((months[monthKey]?.income || 0).toFixed(2)),
          expense: parseFloat((months[monthKey]?.expense || 0).toFixed(2)),
        };
      });

      return [
        { name: `Entrate ${year}`, data: monthlyData.map((m) => m.income) },
        { name: `Uscite ${year}`, data: monthlyData.map((m) => m.expense) },
      ];
    });

    // Appiattisci i colori nell'ordine corretto
    const colors = years.flatMap((_, idx) => yearColors[idx % yearColors.length]);

    return { categories, series, colors };
  };

  const getMultiYearExpenseData = () => {
    const globalReport = settings.owner?.report?.globalReport;
    if (!globalReport) return [];

    const years = (settings.owner.report?.years || []).slice().sort();

    return years.map((year) => {
      const yearReport = globalReport[year];
      const months = yearReport?.months || {};
      const data = Array.from({ length: 12 }, (_, i) => {
        const monthKey = (i + 1).toString().padStart(2, '0');
        return parseFloat((months[monthKey]?.expense || 0).toFixed(2));
      });
      return { name: `Uscite ${year}`, data };
    });
  };

  const getYearlySalesData = () => {
    // Check if we have data and settings
    const globalReport = settings.owner?.report?.globalReport;
    if (!globalReport) return { chartCategories: [], series: [] };

    // Get current year and previous year
    const currentYear = settings.year;
    const previousYear = (parseInt(settings.year, 10) - 1).toString();
    
    // Verify if we have data for both years
    if (!globalReport[currentYear]) {
      return { chartCategories: [], series: [] };
    }
    
    // Create chartCategories array (months)
    const chartCategories = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    
    // Funzione per estrarre i dati mensili di un determinato anno (con filtro se attivo)
    const extractMonthlyData = (year) => {
      const months = globalReport[year]?.months || {};
      return Array.from({ length: 12 }, (_, i) => {
        const monthKey = (i + 1).toString().padStart(2, '0');

        return {
          income: parseFloat((months[monthKey]?.income || 0).toFixed(2)),
          expense: parseFloat((months[monthKey]?.expense || 0).toFixed(2)),
        };
      });
    };
    
    // Estrai dati per l'anno corrente
    const monthlyDataCurrentYear = extractMonthlyData(currentYear);
    
    // Estrai dati per l'anno precedente se disponibili
    const monthlyDataPreviousYear = extractMonthlyData(previousYear);
    
    // Crea le serie per il grafico
    const series = [];
    
    // Anno corrente
    series.push({
      year: currentYear,
      data: [
        {
          name: `Entrate ${currentYear}`,
          data: monthlyDataCurrentYear.map(m => m.income),
        },
        {
          name: `Uscite ${currentYear}`,
          data: monthlyDataCurrentYear.map(m => m.expense),
        },
      ],
    });
    
    // Anno precedente (se disponibile)
    if (globalReport[previousYear]) {
      series.push({
        year: previousYear,
        data: [
          {
            name: `Entrate ${previousYear}`,
            data: monthlyDataPreviousYear.map(m => m.income),
          },
          {
            name: `Uscite ${previousYear}`,
            data: monthlyDataPreviousYear.map(m => m.expense),
          },
        ],
      });
    }
    
    return { chartCategories, series };
  };

  const getChartData = () => {
    if (!data || !settings.year || !settings.owner) {
      return [];
    }

    let globalReport;

    // Special handling for 'all-accounts' case
    if (settings.owner.id === 'all-accounts') {
      globalReport = settings.owner.report?.globalReport;
    } else {
      // Regular case: find the owner in the data array
      const selectedOwner = data.find((owner) => owner.id === settings.owner.id);
      if (!selectedOwner) {
        return [];
      }

      globalReport = selectedOwner.report?.globalReport;
    }

    if (!globalReport) {
      return [];
    }

    const currentYear = settings.year; // Anno selezionato
    
    // Per 'all-years' non mostriamo il grafico mensile (non ha senso mostrare tutti gli anni)
    if (currentYear === 'all-years') {
      return [];
    }
    
    const previousYear = (parseInt(settings.year, 10) - 1).toString(); // Anno precedente

    // Verifica se ci sono dati per l'anno corrente
    if (!globalReport[currentYear]) {
      // Se non ci sono dati per l'anno corrente, mostriamo un messaggio all'utente
      // se lo Snackbar non è già aperto
      if (!snackbar.open) {
        setSnackbar({
          open: true,
          message: `Non ci sono dati disponibili per l'anno ${currentYear}.`,
          severity: 'info'
        });
      }
      return [];
    }

    // Funzione per estrarre i dati mensili per un determinato anno (con filtro se attivo)
    const extractMonthlyData = (year) => {
      const months = globalReport[year]?.months || {};
      return Array.from({ length: 12 }, (_, i) => {
        const monthKey = (i + 1).toString().padStart(2, '0'); // Formatta 01, 02, ..., 12

        // Arrotondiamo a 2 decimali per maggiore precisione
        return {
          income: parseFloat((months[monthKey]?.income || 0).toFixed(2)),
          expense: parseFloat((months[monthKey]?.expense || 0).toFixed(2)),
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

  // Memoize i risultati per evitare chiamate multiple durante il render
  const currentBalanceData = useMemo(() => {
    if (!data || !settings.owner) return { balance: 0, percentChange: 0, description: '', lastUpdate: new Date() };
    return getCurrentBalance();
  }, [data, settings.owner, settings.year]);
  
  const globalIncomeData = useMemo(() => {
    if (!data || !settings.owner) return { incomeData: [], totalIncome: 0, percentChange: 0 };
    return getGlobalIncome();
  }, [data, settings.owner, settings.year, selectedMonth]);
  
  const globalExpenseData = useMemo(() => {
    if (!data || !settings.owner) return { expenseData: [], totalExpense: 0, percentChange: 0 };
    return getGlobalExpense();
  }, [data, settings.owner, settings.year, selectedMonth]);
  
  const chartData = useMemo(() => {
    if (!data || !settings.owner) return [];
    return getChartData();
  }, [data, settings.owner, settings.year]);

  const monthlyExpenseTrendData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Use the "Uscite {currentYear}" series (index 1)
    const expenseSeries = chartData.find((s) => s.name && s.name.startsWith('Uscite') && !s.name.includes((parseInt(settings.year, 10) - 1).toString()));
    if (!expenseSeries) return [];
    return [{ name: expenseSeries.name, data: expenseSeries.data }];
  }, [chartData, settings.year]);

  const multiYearAreaData = useMemo(() => {
    if (!data || !settings.owner || settings.year !== 'all-years') return null;
    return getMultiYearAreaData();
  }, [data, settings.owner, settings.year]);

  const multiYearExpenseData = useMemo(() => {
    if (!data || !settings.owner || settings.year !== 'all-years') return [];
    return getMultiYearExpenseData();
  }, [data, settings.owner, settings.year]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4" sx={{ mb: 3, mt: 2 }}>
        {user?.firstname || user?.firstName || ''} {user?.lastname || user?.lastName || ''}
      </Typography>

      {/* Card filtri semplificata */}
      {data && data.length > 0 && availableYears.length > 0 && settings.owner && (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ py: 2, px: 3, mb: 3 }}
        >
          {/* Select Anno */}
          <Select
            size="small"
            value={settings.year || ''}
            onChange={handleYearChange}
            displayEmpty
            sx={{ minWidth: 140 }}
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year === 'all-years' ? 'Tutti gli anni' : year}
              </MenuItem>
            ))}
          </Select>

          {/* Select Conto */}
          <Select
            size="small"
            value={settings.owner?.id || ''}
            onChange={handleOwnerChange}
            displayEmpty
            renderValue={(selected) => {
              if (selected === 'all-accounts') return 'Tutti i conti';
              const found = sortedData.find(o => o.id === selected);
              if (!found) return '';
              return found.cc ? `${found.name} | ${found.cc}` : found.name;
            }}
            sx={{
              minWidth: 200,
              width: `${Math.max(200, Math.max(...[{ name: 'Tutti i conti', cc: '' }, ...sortedData].map(o => (o.cc ? `${o.name} | ${o.cc}` : o.name).length)) * 9 + 48)}px`,
            }}
          >
            <MenuItem value="all-accounts">Tutti i conti</MenuItem>
            {sortedData.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name}{owner.cc ? ` | ${owner.cc}` : ''}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      )}
      {data && settings.owner && settings.owner.report && currentBalanceData && globalIncomeData && globalExpenseData ? (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {settings.owner.id !== 'all-accounts' && (
                <BankingWidgetSummary
                  title="Saldo corrente"
                  icon="solar:wallet-money-bold"
                  percent={currentBalanceData.percentChange || 0}
                  total={currentBalanceData.balance || 0}
                  description={currentBalanceData.description || ''}
                  color="info"
                  chart={{ series: [] }}
                  sx={{
                    '&::before, &::after': {
                      backgroundColor: (theme) => theme.palette.info.lighter,
                    },
                    boxShadow: (theme) => `0 4px 12px ${theme.palette.info.lighter}`,
                  }}
                />
              )}

              <BankingWidgetSummary
                title="Entrate"
                icon="eva:diagonal-arrow-left-down-fill"
                percent={globalIncomeData.percentChange || 0}
                total={globalIncomeData.totalIncome || 0}
                description={settings.year !== 'all-years' ? `Gen – ${selectedMonthLabel} ${settings.year}` : undefined}
                chart={{ series: globalIncomeData.incomeData || [] }}
              />

              <BankingWidgetSummary
                title="Uscite"
                color="warning"
                icon="eva:diagonal-arrow-right-up-fill"
                percent={globalExpenseData.percentChange || 0}
                total={globalExpenseData.totalExpense || 0}
                description={settings.year !== 'all-years' ? `Gen – ${selectedMonthLabel} ${settings.year}` : undefined}
                chart={{ series: globalExpenseData.expenseData || [] }}
              />
            </Stack>
          </Grid>
          <Grid size={12}>
            <MasterCategoryTable
              data={data}
              mainYear={settings.year === 'all-years' ? new Date().getFullYear() : Number(settings.year)}
              owner={settings.owner}
              selectedMonth={selectedMonth}
              onMonthChange={handleMonthChange}
            />
          </Grid>
          {(() => {
            const isAllYears = settings.year === 'all-years';

            if (isAllYears) {
              return (
                <>
                  <Grid size={12}>
                    <CategoryChartToggle
                      barSeries={[]}
                      barCategories={[]}
                      hideToggle
                      areaChart={{
                        colors: multiYearAreaData?.colors || [],
                        categories: multiYearAreaData?.categories || [],
                        series: multiYearAreaData?.series || [],
                      }}
                    />
                  </Grid>
                  <Grid size={12}>
                    <MasterMonthlyTrendChart
                      title="Andamento mensile uscite"
                      subheader="Confronto uscite mensili per anno"
                      chartType="line"
                      series={multiYearExpenseData}
                      categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                    />
                  </Grid>
                </>
              );
            }

            return (
              <>
                <Grid size={12}>
                  <CategoryChartToggle
                    barSeries={chartData || []}
                    barCategories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                    areaChart={{
                      colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
                      categories: getYearlySalesData().chartCategories,
                      series: getYearlySalesData().series,
                    }}
                  />
                </Grid>
                <Grid size={12}>
                  <MasterMonthlyTrendChart
                    title="Andamento mensile uscite"
                    subheader={`Media spese mensili per l'anno ${settings.year}`}
                    series={monthlyExpenseTrendData}
                    categories={['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']}
                  />
                </Grid>
              </>
            );
          })()}
        </Grid>
      ) : (
        <Typography variant="h6">
          Non sono ancora disponibili dati sufficienti per generare il report
        </Typography>
      )}

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
