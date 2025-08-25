/**
 * Utility functions for expense calculations
 * Provides intelligent expense analysis and monthly average calculations
 */

/**
 * Calcola la media mensile delle spese con algoritmo intelligente
 * @param {number} totalExpense - Totale spese annuali
 * @param {object} monthlyData - Dati mensili nel formato { '01': {expense: 100}, '02': {expense: 0}, ... }
 * @param {object} options - Opzioni di configurazione
 * @param {number} options.currentYear - Anno corrente (default: 2024)
 * @param {string} options.forceMethod - Metodo forzato ('OCCASIONAL-BUDGET', 'SEASONAL', 'FULL-YEAR')
 * @returns {object} Risultato del calcolo con metodo, spiegazione e affidabilità
 */
export function calculateMonthlyAverageExpense(totalExpense, monthlyData, options = {}) {
  const { currentYear = 2024, forceMethod } = options;

  // Validazione input
  if (!totalExpense || totalExpense <= 0) {
    return {
      average: 0,
      method: 'NO-DATA',
      explanation: 'Nessuna spesa registrata',
      reliability: 'N/A',
      isOccasional: false,
      pattern: 'Nessun dato disponibile'
    };
  }

  if (!monthlyData || Object.keys(monthlyData).length === 0) {
    return {
      average: parseFloat((totalExpense / 12).toFixed(2)),
      method: 'FALLBACK',
      explanation: 'Media annuale senza dettagli mensili',
      reliability: 'BASSA - Dati incompleti',
      isOccasional: false,
      pattern: 'Dati mensili non disponibili'
    };
  }

  // Analizza il pattern di spesa
  const monthsWithExpenses = Object.values(monthlyData).filter(d => d.expense > 0).length;
  const expenseAmounts = Object.values(monthlyData).map(d => d.expense || 0).filter(e => e > 0);
  const sparsityRatio = monthsWithExpenses / 12;
  
  // Calcola statistiche per identificare spese occasionali
  if (expenseAmounts.length === 0) {
    return {
      average: 0,
      method: 'NO-EXPENSES',
      explanation: 'Nessuna spesa nei dati mensili',
      reliability: 'N/A',
      isOccasional: false,
      pattern: 'Nessuna spesa rilevata'
    };
  }

  const avgWhenPresent = expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length;
  const hasHighVariability = expenseAmounts.length > 1 && 
    (Math.max(...expenseAmounts) / Math.min(...expenseAmounts)) > 2.5;
  const hasSingleLargeAmount = expenseAmounts.some(amount => amount > avgWhenPresent * 2);
  
  // Identifica spese occasionali
  const isOccasional = sparsityRatio <= 0.25 || 
    (monthsWithExpenses <= 3 && (hasHighVariability || hasSingleLargeAmount));

  // Applica metodo forzato se specificato
  if (forceMethod) {
    return applyCalculationMethod(forceMethod, totalExpense, monthlyData, monthsWithExpenses, isOccasional);
  }

  // Scelta automatica del metodo
  if (isOccasional) {
    // Spese occasionali: approccio budget (accantona mensilmente)
    const monthlyBudget = parseFloat((totalExpense / 12).toFixed(2));
    return {
      average: monthlyBudget,
      method: 'OCCASIONAL-BUDGET',
      explanation: `Spese occasionali: accantona €${monthlyBudget}/mese per coprire €${totalExpense} annui`,
      reliability: 'MEDIA - Per budgeting',
      isOccasional: true,
      pattern: `${monthsWithExpenses} mesi attivi su 12 (${Math.round(sparsityRatio * 100)}%)`
    };
  } else if (monthsWithExpenses >= 9) {
    // Spese regolari: distribuzione uniforme
    const yearlyAverage = parseFloat((totalExpense / 12).toFixed(2));
    return {
      average: yearlyAverage,
      method: 'FULL-YEAR',
      explanation: `Spese regolari: €${yearlyAverage}/mese costanti`,
      reliability: 'ALTA - Previsione affidabile',
      isOccasional: false,
      pattern: `Distribuite su ${monthsWithExpenses} mesi`
    };
  } else {
    // Spese stagionali: concentrata nel periodo attivo
    const lastMonth = Math.max(...Object.keys(monthlyData).filter(m => monthlyData[m].expense > 0).map(m => parseInt(m, 10)));
    const periodAverage = parseFloat((totalExpense / lastMonth).toFixed(2));
    return {
      average: periodAverage,
      method: 'SEASONAL',
      explanation: `Spese stagionali: €${periodAverage}/mese durante ${lastMonth} mesi attivi`,
      reliability: 'MEDIA - Periodo specifico',
      isOccasional: false,
      pattern: `Concentrate in ${monthsWithExpenses} mesi (fino al mese ${lastMonth})`
    };
  }
}

/**
 * Applica un metodo di calcolo specifico
 */
function applyCalculationMethod(method, totalExpense, monthlyData, monthsWithExpenses, isOccasional) {
  const monthsWithData = Object.keys(monthlyData).filter(m => monthlyData[m].expense > 0);
  const lastMonth = monthsWithData.length > 0 ? 
    Math.max(...monthsWithData.map(m => parseInt(m, 10))) : 12;

  switch (method) {
    case 'OCCASIONAL-BUDGET':
      return {
        average: parseFloat((totalExpense / 12).toFixed(2)),
        method: 'OCCASIONAL-BUDGET',
        explanation: `Accantonamento: €${(totalExpense / 12).toFixed(2)}/mese per spese occasionali`,
        reliability: 'MEDIA - Per budgeting',
        isOccasional: true,
        pattern: `${monthsWithExpenses} mesi attivi (metodo forzato)`
      };
    
    case 'SEASONAL':
      return {
        average: parseFloat((totalExpense / lastMonth).toFixed(2)),
        method: 'SEASONAL',
        explanation: `Media stagionale: €${(totalExpense / lastMonth).toFixed(2)}/mese durante periodo attivo`,
        reliability: 'MEDIA - Periodo specifico',
        isOccasional: false,
        pattern: `${monthsWithExpenses} mesi attivi fino al mese ${lastMonth} (forzato)`
      };
    
    case 'FULL-YEAR':
    default:
      return {
        average: parseFloat((totalExpense / 12).toFixed(2)),
        method: 'FULL-YEAR',
        explanation: `Media annuale: €${(totalExpense / 12).toFixed(2)}/mese distribuzione uniforme`,
        reliability: 'ALTA - Distribuzione uniforme',
        isOccasional: false,
        pattern: `${monthsWithExpenses} mesi attivi distribuiti (forzato)`
      };
  }
}

/**
 * Calcolo legacy compatibile con il metodo esistente (per retrocompatibilità)
 * @param {number} totalExpense - Totale spese annuali  
 * @param {object} monthsData - Dati mensili nel formato { '01': {expense: 100}, ... }
 * @returns {number} Media mensile con metodo legacy
 */
export function calculateLegacyMonthlyAverage(totalExpense, monthsData) {
  if (!totalExpense || totalExpense <= 0) return 0;
  if (!monthsData) return totalExpense / 12;
  
  // Trova l'ultimo mese con spese (metodo esistente)
  const months = Object.entries(monthsData).sort(
    ([a], [b]) => parseInt(a, 10) - parseInt(b, 10)
  );

  const lastMonthWithExpense = months.reduce((lastMonth, [month, monthData]) => {
    if (monthData.expense > 0) {
      return Math.max(lastMonth, parseInt(month, 10));
    }
    return lastMonth;
  }, 0);

  return lastMonthWithExpense > 0 ? totalExpense / lastMonthWithExpense : 0;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}).format(amount || 0);

/**
 * Validate and parse expense data
 * @param {*} value - Value to validate
 * @returns {number} - Parsed and validated number
 */
export const parseExpenseValue = (value) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? 0 : Math.max(0, parsed);
};
