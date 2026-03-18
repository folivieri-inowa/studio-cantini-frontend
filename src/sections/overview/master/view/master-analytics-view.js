'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { paths } from '../../../../routes/paths';
import { useRouter } from '../../../../routes/hooks';
import MasterTransaction from '../master-transaction';
import { useAuthContext } from '../../../../auth/hooks';
import axios, { endpoints } from '../../../../utils/axios';
import { useSettingsContext } from '../../../../components/settings';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import CategoryChartToggle from '../../category/category-chart-toggle';
import MasterMonthlyTrendChart from '../master-monthly-trend-chart';

// ----------------------------------------------------------------------

export default function MasterAnalyticsView() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [dateFilter, setDateFilter] = useState(null); // { startYear, startMonth, endYear, endMonth }
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
  
  // Stato per lo Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

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

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.master.category.details({ id }));
    },
    [router]
  );

  // Funzione per chiudere lo Snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Helper function per filtrare i mesi in base al dateFilter
  const shouldIncludeMonth = useCallback((year, month) => {
    if (!dateFilter) return true;
    
    const yearNum = parseInt(year, 10);
    const monthNum = parseInt(month, 10);
    const startYearNum = parseInt(dateFilter.startYear, 10);
    const endYearNum = parseInt(dateFilter.endYear, 10);
    
    // Converte anno-mese in un numero per confronto facile (es. 2025-10 diventa 202510)
    const current = yearNum * 100 + monthNum;
    const start = startYearNum * 100 + dateFilter.startMonth;
    const end = endYearNum * 100 + dateFilter.endMonth;
    
    const included = current >= start && current <= end;
    
    // Debug: mostra solo i primi check per evitare spam
    // Debug disabled
    
    return included;
  }, [dateFilter]);

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

      // Applica filtro mese se attivo
      const filteredMonths = sortedMonths.filter(([month]) => 
        shouldIncludeMonth(settings.year, month)
      );

      const incomeData = filteredMonths.map(([month, date]) => ({
        x: `${settings.year}-${month.padStart(2, '0')}`,
        y: parseFloat((date?.income ?? 0).toFixed(2)),
      }));

      // Ricalcola totalIncome solo per i mesi filtrati
      const totalIncome = parseFloat(
        filteredMonths.reduce((sum, [, date]) => sum + (date?.income ?? 0), 0).toFixed(2)
      );

      let percentChange = 0;
      if (filteredMonths.length > 1) {
        const lastMonthIncome = parseFloat((filteredMonths[filteredMonths.length - 1][1]?.income ?? 0).toFixed(2));
        const prevMonthIncome = parseFloat((filteredMonths[filteredMonths.length - 2][1]?.income ?? 0).toFixed(2));
        if (prevMonthIncome !== 0) {
          percentChange = parseFloat(((lastMonthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(2));
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

      // Applica filtro mese se attivo
      const filteredMonths = sortedMonths.filter(([month]) => 
        shouldIncludeMonth(year, month)
      );

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

      // Applica filtro mese se attivo
      const filteredMonths = sortedMonths.filter(([month]) => 
        shouldIncludeMonth(settings.year, month)
      );

      const expenseData = filteredMonths.map(([month, date]) => ({
        x: `${settings.year}-${month.padStart(2, '0')}`,
        y: parseFloat((date?.expense ?? 0).toFixed(2)),
      }));

      // Ricalcola totalExpense solo per i mesi filtrati
      const totalExpense = parseFloat(
        filteredMonths.reduce((sum, [, date]) => sum + (date?.expense ?? 0), 0).toFixed(2)
      );

      let percentChange = 0;
      if (filteredMonths.length > 1) {
        const lastMonthExpense = parseFloat((filteredMonths[filteredMonths.length - 1][1]?.expense ?? 0).toFixed(2));
        const prevMonthExpense = parseFloat((filteredMonths[filteredMonths.length - 2][1]?.expense ?? 0).toFixed(2));
        if (prevMonthExpense !== 0) {
          percentChange = parseFloat(((lastMonthExpense - prevMonthExpense) / prevMonthExpense * 100).toFixed(2));
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

      // Applica filtro mese se attivo
      const filteredMonths = sortedMonths.filter(([month]) => 
        shouldIncludeMonth(year, month)
      );

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

  const getCategorySummary = () => {
    if (!data || !settings.owner || !settings.year) return [];

    const isAllYears = settings.year === 'all-years';
    const yearsToAggregate = isAllYears ? settings.owner.report?.years || [] : [settings.year];

    // Helper function to aggregate category data across multiple years with month filtering
    const aggregateCategoryData = (categoryReports, years) => {
      const aggregated = {};
      
      years.forEach(year => {
        const yearReport = categoryReports[year];
        if (!yearReport) return;
        
        Object.entries(yearReport).forEach(([category, values]) => {
          if (!aggregated[category]) {
            aggregated[category] = {
              name: values.name,
              totalIncome: 0,
              totalExpense: 0,
            };
          }
          
          // Se c'è un filtro attivo, aggrega solo i mesi filtrati
          if (dateFilter && values.months) {
            Object.entries(values.months).forEach(([month, monthData]) => {
              if (shouldIncludeMonth(year, month)) {
                aggregated[category].totalIncome += parseFloat(monthData.income) || 0;
                aggregated[category].totalExpense += parseFloat(monthData.expense) || 0;
              }
            });
          } else {
            // Nessun filtro: usa i totali annuali
            aggregated[category].totalIncome += parseFloat(values.totalIncome) || 0;
            aggregated[category].totalExpense += parseFloat(values.totalExpense) || 0;
          }
        });
      });
      
      return aggregated;
    };

    // Special handling for 'all-accounts' case
    if (settings.owner.id === 'all-accounts') {
      const categoryReports = settings.owner.report?.categoryReport;
      if (!categoryReports) {
        // Nessun dato disponibile
        return [];
      }

      // Se c'è un filtro attivo o isAllYears, usa sempre aggregateCategoryData
      const aggregatedData = (isAllYears || dateFilter)
        ? aggregateCategoryData(categoryReports, yearsToAggregate)
        : categoryReports[settings.year];

      if (!aggregatedData) {
        // Nessun dato per anno
        return [];
      }

      return Object.entries(aggregatedData)
        .map(([category, values]) => {
          const roundedIncome = parseFloat(values.totalIncome.toFixed(2)) || 0;
          const roundedExpense = parseFloat(values.totalExpense.toFixed(2)) || 0;
          const roundedDifference = parseFloat((roundedIncome - roundedExpense).toFixed(2));

          return {
            id: category.toLowerCase().replace(/\s+/g, '-'),
            category: values.name,
            income: roundedIncome,
            expense: roundedExpense,
            difference: roundedDifference,
            totalExpense: roundedExpense,
          };
        })
        .sort((a, b) => a.category.localeCompare(b.category, 'it')); // Ordinamento alfabetico
    }

    // Regular case: find the owner in the data array
    const selectedOwner = data.find((owner) => owner.id === settings.owner.id);
    if (!selectedOwner) {
      // Conto non trovato
      return [];
    }

    const categoryReports = selectedOwner.report?.categoryReport;
    if (!categoryReports) {
      // Nessun categoryReport
      return [];
    }

    // Se c'è un filtro attivo o isAllYears, usa sempre aggregateCategoryData
    const aggregatedData = (isAllYears || dateFilter)
      ? aggregateCategoryData(categoryReports, yearsToAggregate)
      : categoryReports[settings.year];

    if (!aggregatedData) {
      // Nessun dato per anno specifico
      return [];
    }

    return Object.entries(aggregatedData)
      .map(([category, values]) => {
        const roundedIncome = parseFloat(values.totalIncome.toFixed(2)) || 0;
        const roundedExpense = parseFloat(values.totalExpense.toFixed(2)) || 0;
        const roundedDifference = parseFloat((roundedIncome - roundedExpense).toFixed(2));
        
        return {
          id: category.toLowerCase().replace(/\s+/g, '-'),
          category: values.name,
          income: roundedIncome,
          expense: roundedExpense,
          difference: roundedDifference,
          totalExpense: roundedExpense,
        };
      })
      .sort((a, b) => a.category.localeCompare(b.category, 'it')); // Ordinamento alfabetico
  };

  // Prepare data for EcommerceYearlySales component
  // Helper function to get the current period label
  const getPeriodLabel = useCallback(() => {
    if (!settings.owner || !settings.year) return '';

    const ownerName = settings.owner.id === 'all-accounts' ? 'Tutti i conti' : settings.owner.name;

    // Se c'è un filtro per mese attivo
    if (dateFilter) {
      const monthNames = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
      const { startMonth: startMonthNum, endMonth: endMonthNum, startYear, endYear } = dateFilter;
      const startMonth = monthNames[startMonthNum - 1];
      const endMonth = monthNames[endMonthNum - 1];

      if (startYear === endYear && startMonth === endMonth) {
        // Singolo mese
        return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${startYear} • ${ownerName}`;
      }
      if (startYear === endYear) {
        // Range nello stesso anno
        return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)}-${endMonth} ${startYear} • ${ownerName}`;
      }
      // Range tra anni diversi
      return `${startMonth.charAt(0).toUpperCase() + startMonth.slice(1)} ${startYear} - ${endMonth} ${endYear} • ${ownerName}`;
    }

    // Nessun filtro mese: mostra anno
    if (settings.year === 'all-years') {
      return `Tutto il periodo • ${ownerName}`;
    }

    return `Anno ${settings.year} • ${ownerName}`;
  }, [settings.owner, settings.year, dateFilter]);

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
        const monthNum = i + 1;
        
        // Se c'è un filtro attivo e questo mese non è incluso, ritorna 0
        if (!shouldIncludeMonth(year, monthNum.toString())) {
          return { income: 0, expense: 0 };
        }
        
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
        const monthNum = i + 1;
        
        // Se c'è un filtro attivo e questo mese non è incluso, ritorna 0
        if (!shouldIncludeMonth(year, monthNum.toString())) {
          return { income: 0, expense: 0 };
        }
        
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
  }, [data, settings.owner, settings.year, dateFilter]);
  
  const globalIncomeData = useMemo(() => {
    if (!data || !settings.owner) return { incomeData: [], totalIncome: 0, percentChange: 0 };
    return getGlobalIncome();
  }, [data, settings.owner, settings.year, dateFilter]);
  
  const globalExpenseData = useMemo(() => {
    if (!data || !settings.owner) return { expenseData: [], totalExpense: 0, percentChange: 0 };
    return getGlobalExpense();
  }, [data, settings.owner, settings.year, dateFilter]);
  
  const chartData = useMemo(() => {
    if (!data || !settings.owner) return [];
    return getChartData();
  }, [data, settings.owner, settings.year, dateFilter]);

  const monthlyExpenseTrendData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    // Use the "Uscite {currentYear}" series (index 1)
    const expenseSeries = chartData.find((s) => s.name && s.name.startsWith('Uscite') && !s.name.includes((parseInt(settings.year, 10) - 1).toString()));
    if (!expenseSeries) return [];
    return [{ name: expenseSeries.name, data: expenseSeries.data }];
  }, [chartData, settings.year]);

  const categorySummaryData = useMemo(() => {
    if (!data || !settings.owner) return [];
    return getCategorySummary();
  }, [data, settings.owner, settings.year, dateFilter]);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography variant="h4" sx={{ mb: 3, mt: 2 }}>
        {user?.firstname || user?.firstName || ''} {user?.lastname || user?.lastName || ''}
      </Typography>

      <Stack
        spacing={3}
        sx={{
          mb: 5,
          p: 3,
          bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
          borderRadius: 2,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.palette.mode === 'light' ? '0 1px 2px 0 rgba(0,0,0,0.05)' : 'none',
        }}
      >
        {data && settings.owner && settings.owner.report && settings.owner.report.years && (
          <>
            {/* Quick Filters */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 1 }}>
                ⚡ Filtri rapidi:
              </Typography>
              {QUICK_FILTERS.map((filter) => {
                // Determina se questo filtro è attivo basandosi sullo stato activeFilter
                const isActive = activeFilter === filter.id;
                
                return (
                  <Chip
                    key={filter.id}
                    label={filter.label}
                    size="small"
                    onClick={() => handleQuickFilter(filter.id)}
                    color={isActive ? 'primary' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      boxShadow: isActive ? '0 2px 8px rgba(25, 118, 210, 0.25)' : 'none',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: isActive ? 'primary.dark' : 'action.hover',
                        transform: 'translateY(-1px)',
                        boxShadow: isActive ? '0 4px 12px rgba(25, 118, 210, 0.35)' : '0 2px 4px rgba(0,0,0,0.1)',
                      },
                    }}
                  />
                );
              })}
              
              {/* Transaction Statistics */}
              {transactionStats.total > 0 && (
                <Chip
                  label={`📊 ${transactionStats.total.toLocaleString('it-IT')} transazioni totali`}
                  size="small"
                  color="info"
                  variant="outlined"
                  sx={{ ml: 'auto' }}
                />
              )}
            </Stack>

            {/* Period Label */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{
                py: 1.5,
                px: 2,
                bgcolor: 'background.paper',
                borderRadius: 1.5,
                border: (theme) => `1px solid ${theme.palette.primary.main}`,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                📍 Visualizzazione: <span style={{ fontWeight: 700 }}>{getPeriodLabel()}</span>
              </Typography>
            </Stack>

            <Divider />

            {/* Main Filters */}
            <Stack direction="row" spacing={2} alignItems="flex-end">
              <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Anno
                </Typography>
                <Select
                  id="current-year"
                  onChange={handleYearChange}
                  value={settings.year || ''}
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                  }}
                >
                  {settings.owner && settings.owner.report.years.length > 1 && (
                    <MenuItem key="all-years" value="all-years">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          📅 Tutto il periodo
                        </Typography>
                      </Stack>
                    </MenuItem>
                  )}
                  {settings.owner && settings.owner.report.years.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Divider orientation="vertical" flexItem />

              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 300 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Conto corrente
                </Typography>
                <Select
                  id="current-owner"
                  onChange={handleOwnerChange}
                  value={settings.owner?.id || ''}
                  size="small"
                  sx={{
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                  }}
                >
                  <MenuItem key="all-accounts" value="all-accounts">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        📊 Tutti i conti
                      </Typography>
                    </Stack>
                  </MenuItem>
                  {sortedData.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2">
                          {option.isCreditCard ? '💳' : '🏦'}
                        </Typography>
                        <Typography variant="body2">
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({option.cc})
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>

            <Divider />

            {/* Custom Date Filter */}
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                🗓️ Filtro date personalizzato
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <DatePicker
                    label="Data inizio (opzionale)"
                    value={customStartDate}
                    onChange={(newValue) => setCustomStartDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 },
                        placeholder: 'Dall\'inizio'
                      }
                    }}
                  />
                  <DatePicker
                    label="Data fine *"
                    value={customEndDate}
                    onChange={(newValue) => setCustomEndDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 },
                        required: true
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={handleApplyCustomDateFilter}
                    disabled={!customEndDate}
                    sx={{ minWidth: 120 }}
                  >
                    Applica
                  </Button>
                  <Button
                    variant="outlined"
                    size="medium"
                    onClick={handleClearCustomDateFilter}
                    disabled={!customStartDate && !customEndDate}
                    sx={{ minWidth: 120 }}
                  >
                    Cancella
                  </Button>
                  {customEndDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {customStartDate 
                        ? '💡 Visualizza dati nel periodo specificato (ignora filtro anno)'
                        : `💡 Visualizza tutti i dati ${settings.year === 'all-years' ? 'dall\'inizio' : 'da gennaio ' + settings.year} fino alla data di fine`
                      }
                    </Typography>
                  )}
                </Stack>
              </LocalizationProvider>
            </Stack>
          </>
        )}
      </Stack>
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
                chart={{ series: globalIncomeData.incomeData || [] }}
              />

              <BankingWidgetSummary
                title="Uscite"
                color="warning"
                icon="eva:diagonal-arrow-right-up-fill"
                percent={globalExpenseData.percentChange || 0}
                total={globalExpenseData.totalExpense || 0}
                chart={{ series: globalExpenseData.expenseData || [] }}
              />
            </Stack>
          </Grid>
          <Grid size={12}>
            <Stack direction="column" spacing={3}>
              
              {/* Sezione Analisi Raggruppata */}
              <Grid size={12}>
                <GroupAggregation
                  categories={categories}
                  categoriesLoading={categoriesLoading}
                  categoriesError={categoriesError}
                  db={settings.db}
                  settings={settings}
                  dateFilter={dateFilter}
                />
              </Grid>
              
              <Grid size={12}>
                <MasterTransaction
                  title="Riepilogo per categorie"
                  handleViewRow={handleViewRow}
                  tableData={categorySummaryData} // Dati riepilogativi delle categorie
                  tableLabels={[
                    { id: 'category', label: 'Categoria' },
                    { id: 'income', label: 'Entrate (€)', align: 'right' },
                    { id: 'expense', label: 'Uscite (€)', align: 'right' },
                    { id: 'totalExpense', label: 'Totale spese annuale (€)', align: 'right' },
                    { id: 'difference', label: 'Delta annuale (€)', align: 'right' },
                  ]}
                />
              </Grid>
            </Stack>
          </Grid>
          {(() => {
            const isAllYears = settings.year === 'all-years';
            const isMultiYearFilter = dateFilter && dateFilter.startYear !== dateFilter.endYear;
            const hideCharts = isAllYears || isMultiYearFilter;

            if (hideCharts) {
              return (
                <Grid size={12}>
                  <Card sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      I grafici di andamento mensile non sono disponibili per periodi che coprono più anni.
                    </Typography>
                    <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                      Seleziona un anno specifico per visualizzare l&apos;andamento mensile.
                    </Typography>
                  </Card>
                </Grid>
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
