/**
 * Utility functions for expense calculations
 * Centralizes the logic for calculating monthly averages
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
export const calculateMonthlyAverageExpense = (totalExpense, monthlyData, options = {}) => {
  if (!totalExpense || totalExpense <= 0) {
    return {
      averageExpense: 0,
      methodUsed: 'no-expenses',
      explanation: 'Nessuna spesa registrata',
      reliability: 'N/A',
      isOccasional: false
    };
  }

  const { method = 'smart', currentYear = new Date().getFullYear(), currentMonth = new Date().getMonth() + 1 } = options;
  
  // Find the last month with expenses
  const lastMonthWithExpense = Object.entries(monthlyData || {}).reduce((lastMonth, [month, data]) => {
    const monthNum = parseInt(month, 10);
    if (data.expense > 0) {
      return Math.max(lastMonth, monthNum);
    }
    return lastMonth;
  }, 0);

  // Count months with actual expenses
  const monthsWithExpenses = Object.entries(monthlyData || {}).filter(([, data]) => data.expense > 0).length;

  // Analyze expense pattern to detect occasional/one-time expenses
  const expenseAmounts = Object.values(monthlyData || {}).map(d => d.expense || 0).filter(e => e > 0);
  const totalMonths = 12; // Standard year
  const sparsityRatio = monthsWithExpenses / totalMonths;
  
  // Advanced pattern analysis for occasional expenses
  const avgWhenPresent = expenseAmounts.length > 0 ? 
    expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length : 0;
  
  // Criteria for occasional expenses detection:
  // 1. Very sparse (≤25% of months)
  // 2. High variability in amounts
  // 3. Large single amounts compared to average
  const hasHighVariability = expenseAmounts.length > 1 && 
    (Math.max(...expenseAmounts) / Math.min(...expenseAmounts)) > 2.5;
  
  const hasSingleLargeAmount = expenseAmounts.some(amount => amount > avgWhenPresent * 2);
  
  const isOccasional = sparsityRatio <= 0.25 || 
    (monthsWithExpenses <= 3 && (hasHighVariability || hasSingleLargeAmount));

  let averageExpense = 0;
  let methodUsed = method;
  let explanation = '';
  let reliability = 'ALTA';
  let budgetSuggestion = '';

  switch (method) {
    case 'smart': {
      const today = new Date();
      const isCurrentYear = currentYear === today.getFullYear();
      const currentMonthInYear = today.getMonth() + 1;
      
      console.log(`🤖 SMART ANALYSIS:`, {
        analyzingYear: currentYear,
        isCurrentYear,
        currentMonthInYear,
        monthsWithExpenses,
        lastMonthWithExpense,
        totalExpense,
        sparsityRatio: Math.round(sparsityRatio * 100),
        isOccasional
      });
      
      if (isOccasional && !isCurrentYear) {
        // �️ SPESE OCCASIONALI - Gestione speciale
        averageExpense = parseFloat((totalExpense / 12).toFixed(2)); // Budget annuale diviso per 12
        methodUsed = 'occasional-budget';
        explanation = `Spese occasionali (${monthsWithExpenses} mesi): budget annuale distribuito su 12 mesi`;
        reliability = 'MEDIA';
        budgetSuggestion = `Per il budget: accantona €${averageExpense}/mese per coprire queste spese irregolari`;
        
        console.log(`🛍️ OCCASIONAL EXPENSES DETECTED - Budget approach: €${totalExpense} ÷ 12 = €${averageExpense}/mese`);
        
      } else if (isCurrentYear) {
        // 📅 ANNO CORRENTE
        const monthsToConsider = Math.min(currentMonthInYear, lastMonthWithExpense);
        averageExpense = monthsToConsider > 0 ? parseFloat((totalExpense / monthsToConsider).toFixed(2)) : 0;
        methodUsed = 'current-period';
        explanation = `Anno corrente: media su ${monthsToConsider} mesi trascorsi`;
        
        if (isOccasional) {
          explanation += ' ⚠️ Rilevate spese occasionali';
          reliability = 'BASSA';
          budgetSuggestion = `Attenzione: spese irregolari, difficile fare previsioni accurate`;
        }
        
        console.log(`✅ CURRENT-PERIOD: €${totalExpense} ÷ ${monthsToConsider} = €${averageExpense}/mese`);
        
      } else if (monthsWithExpenses >= 9) {
        // 📊 SPESE REGOLARI DISTRIBUITE
        averageExpense = parseFloat((totalExpense / 12).toFixed(2));
        methodUsed = 'full-year';
        explanation = `Spese regolari distribuite su ${monthsWithExpenses} mesi: media annuale affidabile`;
        budgetSuggestion = `Spese regolari: budget €${averageExpense}/mese`;
        
        console.log(`✅ FULL-YEAR: €${totalExpense} ÷ 12 = €${averageExpense}/mese`);
        
      } else if (monthsWithExpenses >= 3) {
        // ⏰ SPESE STAGIONALI/PERIODICHE
        averageExpense = lastMonthWithExpense > 0 ? parseFloat((totalExpense / lastMonthWithExpense).toFixed(2)) : 0;
        methodUsed = 'seasonal';
        explanation = `Spese stagionali/periodiche (${monthsWithExpenses} mesi): media fino al mese ${lastMonthWithExpense}`;
        reliability = 'MEDIA';
        budgetSuggestion = `Spese stagionali: considera il periodo attivo (${lastMonthWithExpense} mesi)`;
        
        console.log(`✅ SEASONAL: €${totalExpense} ÷ ${lastMonthWithExpense} = €${averageExpense}/mese`);
        
      } else {
        // 🎯 SPESE MOLTO CONCENTRATE
        averageExpense = parseFloat((totalExpense / 12).toFixed(2)); // Budget approach anche qui
        methodUsed = 'concentrated-budget';
        explanation = `Spese concentrate in ${monthsWithExpenses} mesi: budget annuale distribuito`;
        reliability = 'MEDIA';
        budgetSuggestion = `Spese concentrate: accantona €${averageExpense}/mese per ${monthsWithExpenses} mesi di attività`;
        
        console.log(`✅ CONCENTRATED: €${totalExpense} ÷ 12 = €${averageExpense}/mese (budget approach)`);
      }
      break;
    }
    
    case 'last-month':
      averageExpense = lastMonthWithExpense > 0 ? parseFloat((totalExpense / lastMonthWithExpense).toFixed(2)) : 0;
      explanation = `Media calcolata sui ${lastMonthWithExpense} mesi fino all'ultima transazione`;
      reliability = isOccasional ? 'BASSA' : 'ALTA';
      break;
      
    case 'full-year':
      averageExpense = parseFloat((totalExpense / 12).toFixed(2));
      explanation = 'Media calcolata su 12 mesi dell\'anno completo';
      reliability = isOccasional ? 'MEDIA' : 'ALTA';
      break;
      
    case 'current-period': {
      const monthsToUse = Math.min(currentMonth, lastMonthWithExpense);
      averageExpense = monthsToUse > 0 ? parseFloat((totalExpense / monthsToUse).toFixed(2)) : 0;
      explanation = `Media calcolata su ${monthsToUse} mesi del periodo corrente`;
      reliability = isOccasional ? 'BASSA' : 'ALTA';
      break;
    }
      
    case 'actual-months':
      averageExpense = monthsWithExpenses > 0 ? parseFloat((totalExpense / monthsWithExpenses).toFixed(2)) : 0;
      explanation = `Media calcolata sui ${monthsWithExpenses} mesi con spese effettive`;
      reliability = isOccasional ? 'BASSA' : 'MEDIA';
      break;
      
    default:
      // Fallback al metodo attuale
      averageExpense = lastMonthWithExpense > 0 ? parseFloat((totalExpense / lastMonthWithExpense).toFixed(2)) : 0;
      methodUsed = 'last-month';
      explanation = `Metodo di default: media sui ${lastMonthWithExpense} mesi`;
      reliability = isOccasional ? 'BASSA' : 'ALTA';
  }

  return {
    averageExpense,
    methodUsed,
    explanation,
    reliability,
    isOccasional,
    budgetSuggestion,
    debugInfo: {
      totalExpense,
      lastMonthWithExpense,
      monthsWithExpenses,
      sparsityRatio: Math.round(sparsityRatio * 100),
      hasHighVariability,
      currentMonth,
      currentYear
    }
  };
};

/**
 * Simple monthly average calculation (backward compatibility)
 * @param {number} totalExpense - Total expenses for the year
 * @param {Object} monthlyData - Object with monthly expense data
 * @param {string} method - 'smart', 'last-month', 'full-year'
 * @returns {number} - Monthly average expense
 */
export const calculateSimpleMonthlyAverage = (totalExpense, monthlyData, method = 'smart') => {
  const result = calculateMonthlyAverageExpense(totalExpense, monthlyData, { method });
  return result.averageExpense;
};

/**
 * Calculate monthly average from transaction array
 * @param {Array} transactions - Array of transactions
 * @param {number} year - Current year
 * @returns {number} - Monthly average expense
 */
export const calculateMonthlyAverageFromTransactions = (transactions, year) => {
  if (!transactions || transactions.length === 0) return 0;

  // Filter expense transactions for the current year
  const expenseTransactions = transactions.filter(tx => 
    parseFloat(tx.amount) < 0 && 
    new Date(tx.date).getFullYear() === parseInt(year, 10)
  );

  if (expenseTransactions.length === 0) return 0;

  // Calculate total expense
  const totalExpense = expenseTransactions.reduce(
    (sum, tx) => sum + Math.abs(parseFloat(tx.amount)), 0
  );

  // Find last month with transactions
  const lastMonth = Math.max(...expenseTransactions.map(tx => 
    new Date(tx.date).getMonth() + 1
  ));

  return lastMonth > 0 
    ? parseFloat((totalExpense / lastMonth).toFixed(2)) 
    : 0;
};

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
