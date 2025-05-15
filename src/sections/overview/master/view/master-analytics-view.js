'use client';

import { useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import { paths } from '../../../../routes/paths';
import { useRouter } from '../../../../routes/hooks';
import MasterTransaction from '../master-transaction';
import { useAuthContext } from '../../../../auth/hooks';
import axios, { endpoints } from '../../../../utils/axios';
import { useSettingsContext } from '../../../../components/settings';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import AnalyticsCurrentVisits from '../../analytics/analytics-current-visits';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

export default function MasterAnalyticsView() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const settings = useSettingsContext();
  const { user } = useAuthContext();
  
  // Stato per lo Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Funzione per caricare i dati dal server
  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching master data from API...');
      // Aggiungiamo un timestamp come parametro per evitare la cache
      const timestamp = new Date().getTime();
      const response = await axios.get(endpoints.report.master, {
        params: {
          db: settings.db,
          _t: timestamp
        }
      });
      console.log('Master data received:', response.data.data);

      // Controlla se il saldo iniziale è presente nei dati
      if (response.data.data && response.data.data.length > 0) {
        const firstOwner = response.data.data[0];
        console.log('Primo owner:', firstOwner);
        console.log('Saldo iniziale del primo owner:', {
          initialBalance: firstOwner.initialBalance,
          tipo: typeof firstOwner.initialBalance,
          valoreConvertitoFloat: parseFloat(firstOwner.initialBalance || 0)
        });
      }

      setData(response.data.data);

      // Aggiorna l'owner corrente se esiste, altrimenti imposta il primo della lista
      if (settings.owner && response.data.data.length > 0) {
        // Trova l'owner corrispondente nei nuovi dati
        const currentOwner = response.data.data.find(owner => owner.id === settings.owner.id);
        if (currentOwner) {
          // Aggiorna l'owner con i dati freschi
          console.log('Aggiornamento owner esistente:', currentOwner);
          settings.onChangeOwner(currentOwner);
        }
      } else if (response.data.data.length > 0) {
        // Se non c'è un owner selezionato, imposta il primo
        settings.onChangeOwner(response.data.data[0]);
      }

      // Solo se non c'è ancora un anno selezionato, impostiamo il primo anno disponibile
      if (!settings.year && response.data.data.length > 0 && response.data.data[0].report?.years?.length) {
        settings.onChangeYear(response.data.data[0].report.years[0]);
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Carica i dati all'avvio e quando cambia il database
    fetchData();

    // Aggiorniamo i dati ogni 30 secondi per mantenerli sincronizzati più frequentemente
    const intervalId = setInterval(fetchData, 30000);

    // Puliamo l'intervallo quando il componente viene smontato
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.db]); // Riesegui quando cambia il database

  const handleYearChange = (event) => {
    const newYear = event.target.value;
    const currentOwnerId = settings.owner?.id;
    
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
  };

  const handleOwnerChange = (event) => {
    const selectedValue = event.target.value;

    if (selectedValue === 'all-accounts') {
      // Create a special owner object that represents all accounts combined
      const allAccountsOwner = {
        id: 'all-accounts',
        name: 'Tutti i conti',
        cc: '',
        iban: '',
        initialBalance: 0,
        balanceDate: null,
        // Per "Tutti i conti", filtriamo escludendo le carte di credito
        report: {
          years: [], // Will be populated below
          globalReport: {},
          categoryReport: {},
        },
      };

      // Combine data from all owners, escludendo quelli con isCreditCard=true
      if (data && data.length > 0) {
        // Filtriamo gli owner escludendo le carte di credito
        const nonCreditCardOwners = data.filter(owner => !owner.isCreditCard);

        // Collect all available years from filtered owners
        const allYears = new Set();
        nonCreditCardOwners.forEach(owner => {
          owner.report.years.forEach(year => allYears.add(year));
        });
        allAccountsOwner.report.years = Array.from(allYears).sort((a, b) => b - a);

        // For each year, combine the global reports from filtered owners
        allAccountsOwner.report.years.forEach(year => {
          allAccountsOwner.report.globalReport[year] = { income: 0, expense: 0, months: {} };

          // Initialize months
          for (let month = 1; month <= 12; month++) {
            const monthKey = month.toString().padStart(2, '0');
            allAccountsOwner.report.globalReport[year].months[monthKey] = { income: 0, expense: 0 };
          }

          // Combine data from filtered owners for this year
          nonCreditCardOwners.forEach(owner => {
            const ownerReport = owner.report.globalReport[year];
            if (ownerReport) {
              // Add to yearly totals
              allAccountsOwner.report.globalReport[year].income += parseFloat(ownerReport.income || 0);
              allAccountsOwner.report.globalReport[year].expense += parseFloat(ownerReport.expense || 0);

              // Add to monthly totals
              Object.entries(ownerReport.months).forEach(([month, monthData]) => {
                allAccountsOwner.report.globalReport[year].months[month].income += parseFloat(monthData.income || 0);
                allAccountsOwner.report.globalReport[year].months[month].expense += parseFloat(monthData.expense || 0);
              });
            }
          });

          // Round values for precision
          allAccountsOwner.report.globalReport[year].income = parseFloat(allAccountsOwner.report.globalReport[year].income.toFixed(2));
          allAccountsOwner.report.globalReport[year].expense = parseFloat(allAccountsOwner.report.globalReport[year].expense.toFixed(2));

          Object.keys(allAccountsOwner.report.globalReport[year].months).forEach(month => {
            allAccountsOwner.report.globalReport[year].months[month].income = parseFloat(allAccountsOwner.report.globalReport[year].months[month].income.toFixed(2));
            allAccountsOwner.report.globalReport[year].months[month].expense = parseFloat(allAccountsOwner.report.globalReport[year].months[month].expense.toFixed(2));
          });

          // Combine category reports
          allAccountsOwner.report.categoryReport[year] = {};

          // Get all unique categories from filtered owners
          const allCategories = new Set();
          nonCreditCardOwners.forEach(owner => {
            const categoryReport = owner.report.categoryReport[year];
            if (categoryReport) {
              Object.keys(categoryReport).forEach(categoryId => allCategories.add(categoryId));
            }
          });

          // Combine category data
          allCategories.forEach(categoryId => {
            allAccountsOwner.report.categoryReport[year][categoryId] = {
              id: categoryId,
              name: '', // Will be set from the first owner that has this category
              totalIncome: 0,
              totalExpense: 0,
              months: {},
            };

            // Initialize months
            for (let month = 1; month <= 12; month++) {
              const monthKey = month.toString().padStart(2, '0');
              allAccountsOwner.report.categoryReport[year][categoryId].months[monthKey] = { income: 0, expense: 0 };
            }

            // Combine data from filtered owners for this category
            nonCreditCardOwners.forEach(owner => {
              const categoryReport = owner.report.categoryReport[year];
              if (categoryReport && categoryReport[categoryId]) {
                // Set category name if not already set
                if (!allAccountsOwner.report.categoryReport[year][categoryId].name) {
                  allAccountsOwner.report.categoryReport[year][categoryId].name = categoryReport[categoryId].name;
                }

                // Add to yearly totals
                allAccountsOwner.report.categoryReport[year][categoryId].totalIncome += parseFloat(categoryReport[categoryId].totalIncome || 0);
                allAccountsOwner.report.categoryReport[year][categoryId].totalExpense += parseFloat(categoryReport[categoryId].totalExpense || 0);

                // Add to monthly totals
                Object.entries(categoryReport[categoryId].months).forEach(([month, monthData]) => {
                  allAccountsOwner.report.categoryReport[year][categoryId].months[month].income += parseFloat(monthData.income || 0);
                  allAccountsOwner.report.categoryReport[year][categoryId].months[month].expense += parseFloat(monthData.expense || 0);
                });
              }
            });

            // Round values for precision
            allAccountsOwner.report.categoryReport[year][categoryId].totalIncome = parseFloat(allAccountsOwner.report.categoryReport[year][categoryId].totalIncome.toFixed(2));
            allAccountsOwner.report.categoryReport[year][categoryId].totalExpense = parseFloat(allAccountsOwner.report.categoryReport[year][categoryId].totalExpense.toFixed(2));

            Object.keys(allAccountsOwner.report.categoryReport[year][categoryId].months).forEach(month => {
              allAccountsOwner.report.categoryReport[year][categoryId].months[month].income = parseFloat(allAccountsOwner.report.categoryReport[year][categoryId].months[month].income.toFixed(2));
              allAccountsOwner.report.categoryReport[year][categoryId].months[month].expense = parseFloat(allAccountsOwner.report.categoryReport[year][categoryId].months[month].expense.toFixed(2));
            });
          });
        });
      }

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
        
        console.log(`L'anno ${currentYear} non è disponibile per il conto selezionato. Seleziono automaticamente l'anno ${firstAvailableYear}`);
        
        // Aggiorna prima l'owner e poi l'anno per evitare problemi di rendering
        settings.onChangeOwner(selectedOwner);
        settings.onChangeYear(firstAvailableYear);
      } else {
        // L'anno corrente è disponibile, aggiorna solo l'owner
        settings.onChangeOwner(selectedOwner);
      }
    }
  };

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

  const getCurrentBalance = () => {
    // Se non ci sono dati o non è selezionato un proprietario, restituisce valori di default
    if (!data || !data.length || !settings.owner) {
      console.log('Nessun dato o proprietario selezionato');
      return { balance: 0, lastUpdate: new Date(), percentChange: 0, description: 'Nessun dato disponibile' };
    }

    const { owner } = settings;

    // Controllo e conversione dei valori numerici
    const initialBalance = owner.initialBalance ? parseFloat(owner.initialBalance) : 0;
    const balanceDate = owner.balanceDate ? new Date(owner.balanceDate) : null;

    console.log('Dati saldo:', {
      initialBalance,
      balanceDate,
      ownerInitialBalance: owner.initialBalance,
      tipoInitialBalance: typeof owner.initialBalance
    });

    // Calcoliamo il saldo come: saldo iniziale + entrate - uscite
    // per tutti gli anni disponibili fino all'anno selezionato
    const currentYear = parseInt(settings.year, 10);

    // Ottieni tutti gli anni disponibili e ordinali
    if (!owner.report?.globalReport) {
      console.log('Nessun report globale disponibile');
      return { balance: 0, lastUpdate: new Date(), percentChange: 0, description: 'Nessun dato disponibile' };
    }
    const availableYears = Object.keys(owner.report.globalReport).map(y => parseInt(y, 10)).sort();

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
              console.log(`Nuova data di aggiornamento saldo: ${lastMonth}/${year}, ultimo giorno: ${lastDay}, data: ${lastTransaction.toLocaleDateString()}`);
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

    console.log('Calcolo saldo finale:', {
      initialBalance: roundedInitialBalance,
      totalIncome: roundedTotalIncome,
      totalExpense: roundedTotalExpense,
      currentBalance,
      previousYearBalance,
      lastTransaction: lastTransaction.toLocaleDateString('it-IT')
    });

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

    console.log('Descrizione saldo:', description);

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
      y: parseFloat(date.income.toFixed(2)),
    }));

    const totalIncome = parseFloat(selectedReport?.income.toFixed(2)) || 0;

    // Calcolo variazione percentuale rispetto al mese precedente
    let percentChange = 0;
    if (sortedMonths.length > 1) {
      const lastMonthIncome = parseFloat(sortedMonths[sortedMonths.length - 1][1].income.toFixed(2)); // Income dell'ultimo mese
      const prevMonthIncome = parseFloat(sortedMonths[sortedMonths.length - 2][1].income.toFixed(2)); // Income del mese precedente

      if (prevMonthIncome !== 0) {
        percentChange = parseFloat(((lastMonthIncome - prevMonthIncome) / prevMonthIncome * 100).toFixed(2));
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
      y: parseFloat(date.expense.toFixed(2)),
    }));

    const totalExpense = parseFloat(selectedReport?.expense.toFixed(2)) || 0;

    // Calcolo variazione percentuale rispetto al mese precedente
    let percentChange = 0;
    if (sortedMonths.length > 1) {
      const lastMonthExpense = parseFloat(sortedMonths[sortedMonths.length - 1][1].expense.toFixed(2)); // Spesa dell'ultimo mese
      const prevMonthExpense = parseFloat(sortedMonths[sortedMonths.length - 2][1].expense.toFixed(2)); // Spesa del mese precedente

      if (prevMonthExpense !== 0) {
        percentChange = parseFloat(((lastMonthExpense - prevMonthExpense) / prevMonthExpense * 100).toFixed(2));
      }
    }

    return { expenseData, totalExpense, percentChange };
  };

  const getCategorySummary = () => {
    if (!data || !settings.owner || !settings.year) return [];

    // Special handling for 'all-accounts' case
    if (settings.owner.id === 'all-accounts') {
      // Use the categoryReport directly from settings.owner
      const selectedReport = settings.owner.report?.categoryReport[settings.year];
      if (!selectedReport) {
        console.log(`Nessun dato disponibile per l'anno ${settings.year} per tutti i conti`);
        return [];
      }

      return Object.entries(selectedReport).map(([category, values]) => {
        const totalExpense = parseFloat(values.totalExpense) || 0;

        // Find the last month of the year with an expense
        const months = Object.entries(values.months).sort(
          ([a], [b]) => parseInt(a, 10) - parseInt(b, 10)
        );

        const lastMonthWithExpense = months.reduce((lastMonth, [month, monthData]) => {
          if (monthData.expense > 0) {
            return Math.max(lastMonth, parseInt(month, 10));
          }
          return lastMonth;
        }, 0);

        // Calculate the average based on months from January to the last month with expenses
        const averageCost = lastMonthWithExpense > 0 ? totalExpense / lastMonthWithExpense : 0;

        // Round values to two decimal places for greater precision
        const roundedIncome = parseFloat(values.totalIncome.toFixed(2)) || 0;
        const roundedExpense = parseFloat(totalExpense.toFixed(2));
        const roundedDifference = parseFloat((roundedIncome - roundedExpense).toFixed(2));
        const roundedAverageCost = parseFloat(averageCost.toFixed(2));

        return {
          id: category.toLowerCase().replace(/\s+/g, '-'),
          category: values.name,
          income: roundedIncome,
          expense: roundedExpense,
          difference: roundedDifference,
          averageCost: roundedAverageCost,
        };
      });
    }

    // Regular case: find the owner in the data array
    const selectedOwner = data.find((owner) => owner.id === settings.owner.id);
    if (!selectedOwner) {
      console.log('Conto corrente selezionato non trovato nei dati');
      return [];
    }

    // Prende il report dal dataset caricato
    const selectedReport = selectedOwner.report?.categoryReport[settings.year];
    if (!selectedReport) {
      console.log(`Nessun dato disponibile per l'anno ${settings.year} per il conto corrente ${selectedOwner.name}`);
      return [];
    }

    return Object.entries(selectedReport).map(([category, values]) => {
      const totalExpense = parseFloat(values.totalExpense) || 0;

      // Trova l'ultimo mese dell'anno in cui c'è stata una spesa
      const months = Object.entries(values.months).sort(
        ([a], [b]) => parseInt(a, 10) - parseInt(b, 10)
      );

      const lastMonthWithExpense = months.reduce((lastMonth, [month, monthData]) => {
        if (monthData.expense > 0) {
          return Math.max(lastMonth, parseInt(month, 10));
        }
        return lastMonth;
      }, 0);

      // Calcola la media basata sui mesi da gennaio fino all'ultimo mese con spese
      const averageCost = lastMonthWithExpense > 0 ? totalExpense / lastMonthWithExpense : 0;

      // Arrotonda i valori a due decimali per maggiore precisione
      const roundedIncome = parseFloat(values.totalIncome.toFixed(2)) || 0;
      const roundedExpense = parseFloat(totalExpense.toFixed(2));
      const roundedDifference = parseFloat((roundedIncome - roundedExpense).toFixed(2));
      const roundedAverageCost = parseFloat(averageCost.toFixed(2));

      return {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        category: values.name,
        income: roundedIncome,
        expense: roundedExpense,
        difference: roundedDifference,
        averageCost: roundedAverageCost,
      };
    });
  };

  const getChartData = () => {
    if (!data || !settings.year || !settings.owner) {
      console.log('Dati mancanti per il grafico: nessun dato, anno o owner');
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
        console.log('Owner selezionato non trovato nei dati');
        return [];
      }

      globalReport = selectedOwner.report?.globalReport;
    }

    if (!globalReport) {
      console.log('Nessun report globale disponibile');
      return [];
    }

    const currentYear = settings.year; // Anno selezionato
    const previousYear = (parseInt(settings.year, 10) - 1).toString(); // Anno precedente

    // Verifica se ci sono dati per l'anno corrente
    if (!globalReport[currentYear]) {
      console.log(`Nessun dato disponibile per l'anno ${currentYear}`);
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

    // Funzione per estrarre i dati mensili per un determinato anno
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
              {user?.firstname} {user?.lastname}
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
                  value={settings.year}
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
                  <MenuItem key="all-accounts" value="all-accounts">
                    Tutti i conti
                  </MenuItem>
                  {data.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name} | {option.cc}{' '}
                      {option.isCreditCard && '(Carta di Credito)'}
                    </MenuItem>
                  ))}
                </Select>

                <Typography
                  variant="button"
                  component="button"
                  onClick={fetchData}
                  sx={{
                    marginLeft: 2,
                    color: 'primary.main',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    backgroundColor: isLoading ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.08)'
                    }
                  }}
                >
                  {isLoading ? 'Aggiornamento...' : 'Aggiorna dati'}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
      {data && settings.owner ? (
        <Grid container spacing={3}>
          <Grid size={12}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {settings.owner.id !== 'all-accounts' && (
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
              )}

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
          <Grid size={4}>              <AnalyticsCurrentVisits
                title="Entrate/uscite"
                chart={{
                  series: [
                    { label: 'Entrate', value: parseFloat(getGlobalIncome().totalIncome) },
                    { label: 'Uscite', value: parseFloat(getGlobalExpense().totalExpense) },
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

      {/* Snackbar per notifiche */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
