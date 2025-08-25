/**
 * Test script per dimostrare il funzionamento del metodo SMART
 * Mostra esattamente come l'algoritmo decide quale formula usare
 */

// Simulo la funzione qui per il test (normalmente importata)
function calculateMonthlyAverageExpense(totalExpense, monthlyData, options = {}) {
  if (!totalExpense || totalExpense <= 0) {
    return {
      averageExpense: 0,
      methodUsed: 'no-expenses',
      explanation: 'Nessuna spesa registrata'
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

  let averageExpense = 0;
  let methodUsed = method;
  let explanation = '';

  if (method === 'smart') {
    const today = new Date();
    const isCurrentYear = currentYear === today.getFullYear();
    const currentMonthInYear = today.getMonth() + 1;
    
    console.log(`   🤖 Analisi automatica:`, {
      annoAnalizzato: currentYear,
      annoCorrente: isCurrentYear ? 'SI' : 'NO',
      mesiConSpese: monthsWithExpenses,
      ultimoMeseConSpese: lastMonthWithExpense,
      totaleSpese: totalExpense
    });
    
    if (isCurrentYear) {
      // CASO 1: Anno corrente
      const monthsToConsider = Math.min(currentMonthInYear, lastMonthWithExpense);
      averageExpense = monthsToConsider > 0 ? parseFloat((totalExpense / monthsToConsider).toFixed(2)) : 0;
      methodUsed = 'current-period';
      explanation = `Anno corrente: media su ${monthsToConsider} mesi trascorsi`;
      console.log(`   ✅ DECISIONE: CURRENT-PERIOD (€${totalExpense} ÷ ${monthsToConsider} = €${averageExpense}/mese)`);
      
    } else if (monthsWithExpenses >= 9) {
      // CASO 2: Spese ben distribuite
      averageExpense = parseFloat((totalExpense / 12).toFixed(2));
      methodUsed = 'full-year';
      explanation = `Spese distribuite su ${monthsWithExpenses} mesi: media annuale`;
      console.log(`   ✅ DECISIONE: FULL-YEAR (€${totalExpense} ÷ 12 = €${averageExpense}/mese)`);
      
    } else if (monthsWithExpenses >= 3) {
      // CASO 3: Spese parzialmente concentrate
      averageExpense = lastMonthWithExpense > 0 ? parseFloat((totalExpense / lastMonthWithExpense).toFixed(2)) : 0;
      methodUsed = 'last-month';
      explanation = `Spese in ${monthsWithExpenses} mesi: media fino al mese ${lastMonthWithExpense}`;
      console.log(`   ✅ DECISIONE: LAST-MONTH (€${totalExpense} ÷ ${lastMonthWithExpense} = €${averageExpense}/mese)`);
      
    } else {
      // CASO 4: Spese molto concentrate
      averageExpense = monthsWithExpenses > 0 ? parseFloat((totalExpense / monthsWithExpenses).toFixed(2)) : 0;
      methodUsed = 'actual-months';
      explanation = `Spese concentrate in ${monthsWithExpenses} mesi: media sui mesi effettivi`;
      console.log(`   ✅ DECISIONE: ACTUAL-MONTHS (€${totalExpense} ÷ ${monthsWithExpenses} = €${averageExpense}/mese)`);
    }
  }

  return { averageExpense, methodUsed, explanation };
}

// ===== ESECUZIONE DEI TEST =====

console.log('🧪 DIMOSTRAZIONE METODO SMART');
console.log('='.repeat(60));

const tests = [
  {
    name: 'TASSE 2024 - Concentrate in 3 mesi',
    data: {
      totalExpense: 3000,
      monthlyData: {
        '01': { expense: 1000 }, '02': { expense: 1000 }, '03': { expense: 1000 },
        '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 0 },
        '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
      },
      options: { method: 'smart', currentYear: 2024, currentMonth: 8 }
    }
  },
  {
    name: 'AFFITTO 2024 - Distribuite in 12 mesi',
    data: {
      totalExpense: 12000,
      monthlyData: {
        '01': { expense: 1000 }, '02': { expense: 1000 }, '03': { expense: 1000 },
        '04': { expense: 1000 }, '05': { expense: 1000 }, '06': { expense: 1000 },
        '07': { expense: 1000 }, '08': { expense: 1000 }, '09': { expense: 1000 },
        '10': { expense: 1000 }, '11': { expense: 1000 }, '12': { expense: 1000 }
      },
      options: { method: 'smart', currentYear: 2024, currentMonth: 8 }
    }
  },
  {
    name: 'SPESE CORRENTI 2025 - Anno in corso (8 mesi)',
    data: {
      totalExpense: 4000,
      monthlyData: {
        '01': { expense: 500 }, '02': { expense: 500 }, '03': { expense: 500 },
        '04': { expense: 500 }, '05': { expense: 500 }, '06': { expense: 500 },
        '07': { expense: 500 }, '08': { expense: 500 }, '09': { expense: 0 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
      },
      options: { method: 'smart', currentYear: 2025, currentMonth: 8 }
    }
  },
  {
    name: 'RISCALDAMENTO 2024 - Stagionale (6 mesi)',
    data: {
      totalExpense: 2400,
      monthlyData: {
        '01': { expense: 400 }, '02': { expense: 400 }, '03': { expense: 400 },
        '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 0 },
        '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
        '10': { expense: 400 }, '11': { expense: 400 }, '12': { expense: 400 }
      },
      options: { method: 'smart', currentYear: 2024, currentMonth: 8 }
    }
  }
];

tests.forEach((test, index) => {
  console.log(`\n${index + 1}️⃣ TEST: ${test.name}`);
  console.log('-'.repeat(50));
  console.log(`   💰 Totale spese: €${test.data.totalExpense}`);
  
  const result = calculateMonthlyAverageExpense(
    test.data.totalExpense,
    test.data.monthlyData,
    test.data.options
  );
  
  console.log(`   📊 Risultato: €${result.averageExpense}/mese`);
  console.log(`   📝 Spiegazione: ${result.explanation}`);
});

console.log('\n' + '='.repeat(60));
console.log('💡 CONCLUSIONE:');
console.log('Il metodo SMART sceglie automaticamente la formula più appropriata');
console.log('basandosi sul pattern delle spese e sul contesto temporale!');
console.log('='.repeat(60));
