'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import { it } from 'date-fns/locale';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { paths } from '../../../../routes/paths';
import GroupAggregation from '../group-aggregation';
import { useRouter } from '../../../../routes/hooks';
import MasterTransaction from '../master-transaction';
import { useAuthContext } from '../../../../auth/hooks';
import axios, { endpoints } from '../../../../utils/axios';
import { useSettingsContext } from '../../../../components/settings';
import BankingWidgetSummary from '../../banking/banking-widget-summary';
import EcommerceMultiYearSales from '../../e-commerce/ecommerce-multi-year-sales';
import { useGetCategoriesForAggregation } from '../../../../api/group-aggregation';
import ChartColumnMultiple from '../../../_examples/extra/chart-view/chart-column-multiple';

// ----------------------------------------------------------------------

// LocalStorage utilities for filter preferences
const STORAGE_KEY = 'master-filter-preferences';

const saveFilterPreferences = (owner, year) => {
  try {
    console.log('💾 Saving filter preferences:', { owner, year });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ owner, year, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error saving filter preferences:', error);
  }
};

const loadFilterPreferences = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const preferences = saved ? JSON.parse(saved) : null;
    console.log('📂 Loading filter preferences:', preferences);
    return preferences;
  } catch (error) {
    console.error('Error loading filter preferences:', error);
    return null;
  }
};

// Quick filter presets
const QUICK_FILTERS = [
  { 
    id: 'current-year', 
    label: 'Anno corrente', 
    getValue: () => new Date().getFullYear().toString(), 
    type: 'year' 
  },
  { 
    id: 'last-year', 
    label: 'Anno scorso', 
    getValue: () => (new Date().getFullYear() - 1).toString(), 
    type: 'year' 
  },
  { 
    id: 'current-month', 
    label: 'Mese corrente', 
    getValue: () => {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        startMonth: now.getMonth() + 1,
        endMonth: now.getMonth() + 1
      };
    }, 
    type: 'month' 
  },
  { 
    id: 'last-6-months', 
    label: 'Ultimi 6 mesi', 
    getValue: () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      return {
        startYear: sixMonthsAgo.getFullYear().toString(),
        startMonth: sixMonthsAgo.getMonth() + 1,
        endYear: now.getFullYear().toString(),
        endMonth: now.getMonth() + 1
      };
    }, 
    type: 'range' 
  },
  { 
    id: 'all-time', 
    label: 'Tutto il periodo', 
    getValue: () => 'all', 
    type: 'all' 
  },
];

// ----------------------------------------------------------------------

export default function MasterAnalyticsView() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [transactionStats, setTransactionStats] = useState({ total: 0, filtered: 0 });
  const [activeFilter, setActiveFilter] = useState(null); // Traccia quale filtro rapido è attivo
  const [dateFilter, setDateFilter] = useState(null); // { startYear, startMonth, endYear, endMonth }
  const [customStartDate, setCustomStartDate] = useState(null); // Date per filtro personalizzato
  const [customEndDate, setCustomEndDate] = useState(null); // Date per filtro personalizzato
  const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
  const settings = useSettingsContext();
  const { user } = useAuthContext();
  
  // Sync activeFilter with settings.year when year is restored to 'all-years'
  useEffect(() => {
    // Skip if no data loaded yet
    if (!data || data.length === 0 || !settings.year) return;
    
    // Only set activeFilter on initial load
    if (isInitialLoad) {
      if (settings.year === 'all-years') {
        // Use setTimeout to ensure state is updated after React finishes rendering
        setTimeout(() => {
          setActiveFilter('all-time');
        }, 0);
      }
      
      setIsInitialLoad(false);
    }
  }, [settings.year, data, isInitialLoad]);
  
  // Ordina alfabeticamente i conti correnti e filtra l'eventuale 'all-accounts' dal backend
  const sortedData = useMemo(() => 
    data ? data.slice()
      .filter(owner => owner.id !== 'all-accounts') // Rimuovi duplicato 'Tutti i conti'
      .sort((a, b) => a.name.localeCompare(b.name)) : []
  , [data]);
  
  // Hook per ottenere le categorie per l'aggregazione
  const {
    categories,
    categoriesLoading,
    categoriesError,
  } = useGetCategoriesForAggregation(settings.db);
  
  // Categories loaded
  
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
      
      // Calculate transaction statistics
      const totalTransactions = fetchedData.reduce((sum, owner) => {
        if (owner.report && owner.report.globalReport) {
          return sum + Object.values(owner.report.globalReport).reduce((yearSum, yearData) => 
            yearSum + Object.values(yearData.months || {}).reduce((monthSum, monthData) => 
              monthSum + (monthData.transactionCount || 0), 0), 0);
        }
        return sum;
      }, 0);
      
      setTransactionStats({ total: totalTransactions, filtered: totalTransactions });

      // Try to restore saved preferences first
      const preferences = loadFilterPreferences();
      const shouldRestorePrefs = preferences && !settings.owner;
      
      if (shouldRestorePrefs) {
        // Find the saved owner in the data
        const savedOwner = fetchedData.find(o => o.id === preferences.owner);
        
        if (savedOwner && savedOwner.report && savedOwner.report.years && savedOwner.report.years.length > 0) {
          const yearToRestore = preferences.year;
          
          // Restore year as-is (including 'all-years')
          if (yearToRestore === 'all-years' || savedOwner.report.years.includes(yearToRestore)) {
            settings.onChangeOwner(savedOwner);
            settings.onChangeYear(yearToRestore);
            return;
          }
        }
      }

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

  const handleYearChange = useCallback((event, fromQuickFilter = false) => {
    const newYear = event.target.value;
    const currentOwnerId = settings.owner?.id;
    
    // Reset active filter quando l'utente cambia manualmente l'anno
    if (!fromQuickFilter) {
      setActiveFilter(null);
    }
    
    // "all-years" è un valore speciale per visualizzare tutti i dati storici
    // Non richiede validazione perché viene gestito dalle funzioni di aggregazione
    if (newYear === 'all-years') {
      settings.onChangeYear(newYear);
      saveFilterPreferences(settings.owner?.id, newYear);
      return;
    }
    
    // Se siamo nel caso "Tutti i conti", non abbiamo bisogno di verificare l'anno
    if (currentOwnerId === 'all-accounts') {
      settings.onChangeYear(newYear);
      saveFilterPreferences(settings.owner?.id, newYear);
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
    saveFilterPreferences(settings.owner?.id, newYear);
  }, [data, settings, setSnackbar, setActiveFilter]);

  const handleOwnerChange = useCallback((event, fromQuickFilter = false) => {
    const selectedValue = event.target.value;

    // Reset active filter quando l'utente cambia manualmente il conto
    if (!fromQuickFilter) {
      setActiveFilter(null);
    }

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
          for (let month = 1; month <= 12; month += 1) {
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
            for (let month = 1; month <= 12; month += 1) {
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
        
        // Anno non disponibile, seleziono automaticamente
        
        // Aggiorna prima l'owner e poi l'anno per evitare problemi di rendering
        settings.onChangeOwner(selectedOwner);
        settings.onChangeYear(firstAvailableYear);
      } else {
        // L'anno corrente è disponibile, aggiorna solo l'owner
        settings.onChangeOwner(selectedOwner);
      }
      
      // Save preferences
      saveFilterPreferences(selectedOwner.id, settings.year);
    }
  }, [data, settings, setActiveFilter]);

  const handleQuickFilter = useCallback((filterId) => {
    const filter = QUICK_FILTERS.find(f => f.id === filterId);
    if (!filter) return;
    
    const filterValue = filter.getValue();
    
    // Imposta questo filtro come attivo
    setActiveFilter(filterId);
    
    // Reset filtro date personalizzato quando si usa un filtro rapido
    setCustomStartDate(null);
    setCustomEndDate(null);
    
    // Se non ci sono dati, mostra errore
    if (!data || data.length === 0) {
      setSnackbar({
        open: true,
        message: 'Dati non ancora caricati. Attendi il caricamento e riprova.',
        severity: 'warning'
      });
      return;
    }

    // Gestione basata sul tipo di filtro
    if (filter.type === 'all') {
      // Per "Tutto il periodo", usiamo il valore speciale "all-years" come anno
      // Questo farà sì che il dashboard aggreghi tutti gli anni disponibili
      if (!settings.owner || !settings.owner.report || !settings.owner.report.years || settings.owner.report.years.length === 0) {
        setSnackbar({
          open: true,
          message: 'Nessun dato disponibili per il conto selezionato',
          severity: 'warning'
        });
        return;
      }
      
      // Trova l'anno più vecchio e più recente
      const availableYears = settings.owner.report.years.map(y => parseInt(y, 10)).sort((a, b) => a - b);
      const oldestYear = availableYears[0];
      const newestYear = availableYears[availableYears.length - 1];
      
      // Visualizzazione periodo completo
      
      // Imposta l'anno speciale "all-years" per indicare che vogliamo tutti i dati
      handleYearChange({ target: { value: 'all-years' } }, true);
      
      // Reset date filter per visualizzare tutto
      setDateFilter(null);
      
      setSnackbar({
        open: true,
        message: `Visualizzazione periodo completo (${oldestYear} - ${newestYear}) per ${settings.owner.name}`,
        severity: 'success'
      });
      
    } else if (filter.type === 'month') {
      // Filtro per mese singolo
      const { year, startMonth, endMonth } = filterValue;
      const monthName = new Date(year, startMonth - 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
      
      // Imposta l'anno
      handleYearChange({ target: { value: year } }, true);
      
      // Imposta il filtro per il mese
      setDateFilter({
        startYear: year,
        startMonth,
        endYear: year,
        endMonth
      });
      
      setSnackbar({
        open: true,
        message: `Visualizzazione ${monthName} per ${settings.owner.name}`,
        severity: 'success'
      });
      
    } else if (filter.type === 'range') {
      // Filtro per range di mesi
      const { startYear, startMonth, endYear, endMonth } = filterValue;
      const startDate = new Date(startYear, startMonth - 1);
      const endDate = new Date(endYear, endMonth - 1);
      
      const startMonthName = startDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
      const endMonthName = endDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' });
      
      // Se attraversa più anni, usa 'all-years', altrimenti usa l'anno finale
      const yearToSet = startYear !== endYear ? 'all-years' : endYear;
      handleYearChange({ target: { value: yearToSet } }, true);
      
      // Imposta il filtro per il range
      setDateFilter({
        startYear,
        startMonth,
        endYear,
        endMonth
      });
      
      setSnackbar({
        open: true,
        message: `Visualizzazione ${startMonthName} - ${endMonthName} per ${settings.owner.name}`,
        severity: 'success'
      });
      
    } else if (filter.type === 'year') {
      // Filtro per anno specifico (include anche i nuovi filtri semplificati)
      const targetYear = filterValue;
      
      // Checking year availability
      
      // Verifica se l'anno è disponibile per l'owner corrente
      if (settings.owner?.report?.years?.includes(targetYear)) {
        handleYearChange({ target: { value: targetYear } }, true);
        
        // Reset date filter per visualizzare l'anno intero
        setDateFilter(null);
        
        setSnackbar({
          open: true,
          message: `Visualizzazione anno ${targetYear} per ${settings.owner.name}`,
          severity: 'success'
        });
      } else {
        // Cerca un owner che ha dati per questo anno
        let ownerWithYear = null;
        if (data && data.length > 0) {
          const allAccounts = data.find(o => o.id === 'all-accounts');
          if (allAccounts && allAccounts.report?.years?.includes(targetYear)) {
            ownerWithYear = allAccounts;
          } else {
            ownerWithYear = data.find(owner => 
              owner.id !== 'all-accounts' &&
              owner.report && 
              owner.report.years && 
              owner.report.years.includes(targetYear)
            );
          }
        }
        
        if (ownerWithYear) {
          // Found owner with year
          handleOwnerChange({ target: { value: ownerWithYear.id } }, true);
          setTimeout(() => {
            handleYearChange({ target: { value: targetYear } }, true);
          }, 150);
          
          setSnackbar({
            open: true,
            message: `Passato a "${ownerWithYear.name}" per visualizzare l'anno ${targetYear}`,
            severity: 'success'
          });
        } else {
          console.warn('Year not found in any owner:', targetYear);
          setSnackbar({
            open: true,
            message: `L'anno ${targetYear} non ha dati disponibili. Verifica che ci siano transazioni per quest'anno.`,
            severity: 'error'
          });
        }
      }
    }
  }, [data, settings.owner, handleYearChange, handleOwnerChange, setSnackbar, setActiveFilter, setDateFilter]);

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

  // Handler per applicare il filtro date personalizzato
  const handleApplyCustomDateFilter = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      setSnackbar({
        open: true,
        message: 'Seleziona sia la data di inizio che quella di fine',
        severity: 'warning'
      });
      return;
    }

    if (customStartDate > customEndDate) {
      setSnackbar({
        open: true,
        message: 'La data di inizio deve essere precedente alla data di fine',
        severity: 'error'
      });
      return;
    }

    // Estrai anno e mese dalle date
    const startYear = customStartDate.getFullYear().toString();
    const startMonth = customStartDate.getMonth() + 1;
    const endYear = customEndDate.getFullYear().toString();
    const endMonth = customEndDate.getMonth() + 1;

    // Applicazione filtro custom

    // Imposta il filtro date
    setDateFilter({ startYear, startMonth, endYear, endMonth });
    
    // Deseleziona i filtri rapidi
    setActiveFilter(null);

    // Se le date sono in anni diversi, usa 'all-years'
    if (startYear !== endYear) {
      handleYearChange({ target: { value: 'all-years' } }, true);
    } else {
      handleYearChange({ target: { value: startYear } }, true);
    }

    setSnackbar({
      open: true,
      message: `Filtro applicato: ${customStartDate.toLocaleDateString('it-IT')} - ${customEndDate.toLocaleDateString('it-IT')}`,
      severity: 'success'
    });
  }, [customStartDate, customEndDate, handleYearChange, setSnackbar, setDateFilter, setActiveFilter]);

  // Handler per resettare il filtro date personalizzato
  const handleClearCustomDateFilter = useCallback(() => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setDateFilter(null);
    setActiveFilter(null);
    
    setSnackbar({
      open: true,
      message: 'Filtro date rimosso',
      severity: 'info'
    });
  }, [setSnackbar, setDateFilter, setActiveFilter]);

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
    const currentYear = parseInt(settings.year, 10);

    // Ottieni tutti gli anni disponibili e ordinali
    if (!owner.report?.globalReport) {
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

      return Object.entries(aggregatedData).map(([category, values]) => {
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
      });
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

    return Object.entries(aggregatedData).map(([category, values]) => {
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
    });
  };

  // Prepare data for EcommerceYearlySales component
  // Helper function to get the current period label
  const getPeriodLabel = useCallback(() => {
    if (!settings.owner || !settings.year) return '';

    const ownerName = settings.owner.id === 'all-accounts' ? 'Tutti i conti' : settings.owner.name;
    
    // Se c'è un filtro custom attivo, mostra le date complete
    if (customStartDate && customEndDate) {
      const formatDate = (date) => date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
      return `${formatDate(customStartDate)} - ${formatDate(customEndDate)} • ${ownerName}`;
    }
    
    // Se c'è un filtro per mese attivo (da filtri rapidi)
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
  }, [settings.owner, settings.year, dateFilter, customStartDate, customEndDate]);

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
                    label="Data inizio"
                    value={customStartDate}
                    onChange={(newValue) => setCustomStartDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 }
                      }
                    }}
                  />
                  <DatePicker
                    label="Data fine"
                    value={customEndDate}
                    onChange={(newValue) => setCustomEndDate(newValue)}
                    slotProps={{
                      textField: {
                        size: 'small',
                        sx: { minWidth: 180 }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    size="medium"
                    onClick={handleApplyCustomDateFilter}
                    disabled={!customStartDate || !customEndDate}
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
                  {(customStartDate || customEndDate) && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      💡 I filtri date personalizzati hanno priorità sui filtri rapidi
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
              series={chartData || []}
            />
          </Grid>
          
          <Grid size={12} sx={{ mt: 3 }}>
            <EcommerceMultiYearSales
              title="Andamento annuale entrate/uscite"
              subheader="Confronto dettagliato entrate e uscite per anno"
              chart={{
                colors: ['#4ADDDE', '#F45757', '#7E8F9E', '#DBA362'],
                categories: getYearlySalesData().chartCategories,
                series: getYearlySalesData().series,
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
