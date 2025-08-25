/**
 * Test specifico per spese occasionali/una tantum
 * Verifica come il metodo SMART gestisce acquisti non ricorrenti
 */

function calculateMonthlyAverageExpense(totalExpense, monthlyData, options = {}) {
  if (!totalExpense || totalExpense <= 0) {
    return {
      averageExpense: 0,
      methodUsed: 'no-expenses',
      explanation: 'Nessuna spesa registrata'
    };
  }

  const { method = 'smart', currentYear = new Date().getFullYear() } = options;
  
  const lastMonthWithExpense = Object.entries(monthlyData || {}).reduce((lastMonth, [month, data]) => {
    const monthNum = parseInt(month, 10);
    if (data.expense > 0) {
      return Math.max(lastMonth, monthNum);
    }
    return lastMonth;
  }, 0);

  const monthsWithExpenses = Object.entries(monthlyData || {}).filter(([, data]) => data.expense > 0).length;

  let averageExpense = 0;
  let methodUsed = method;
  let explanation = '';
  let isOccasional = false;

  if (method === 'smart') {
    const today = new Date();
    const isCurrentYear = currentYear === today.getFullYear();
    const currentMonthInYear = today.getMonth() + 1;
    
    // RILEVAMENTO SPESE OCCASIONALI
    // Analizziamo il pattern delle spese per identificare acquisti una tantum
    const expenseAmounts = Object.values(monthlyData).map(d => d.expense).filter(e => e > 0);
    const totalMonths = Object.keys(monthlyData).length;
    const averageMonthlyWhenPresent = expenseAmounts.length > 0 ? 
      expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length : 0;
    
    // Criteri per identificare spese occasionali:
    // 1. Pochi mesi con spese (≤ 25% dell'anno)
    // 2. Importi molto variabili o concentrati
    const sparsityRatio = monthsWithExpenses / totalMonths;
    const hasLargeVariations = expenseAmounts.length > 1 && 
      Math.max(...expenseAmounts) / Math.min(...expenseAmounts) > 3;
    
    isOccasional = sparsityRatio <= 0.25 || (monthsWithExpenses <= 2 && totalExpense > averageMonthlyWhenPresent * 6);
    
    console.log(`   🔍 Analisi pattern spese:`, {
      mesiConSpese: monthsWithExpenses,
      totaliMesi: totalMonths,
      sparseRatio: Math.round(sparsityRatio * 100) + '%',
      importiVariabili: hasLargeVariations,
      identificateComOccasionali: isOccasional,
      importiMensili: expenseAmounts
    });
    
    if (isCurrentYear) {
      const monthsToConsider = Math.min(currentMonthInYear, lastMonthWithExpense);
      averageExpense = monthsToConsider > 0 ? parseFloat((totalExpense / monthsToConsider).toFixed(2)) : 0;
      methodUsed = 'current-period';
      explanation = `Anno corrente: media su ${monthsToConsider} mesi trascorsi`;
      
      if (isOccasional) {
        explanation += ' ⚠️ ATTENZIONE: Rilevate spese occasionali - media potrebbe non essere rappresentativa';
      }
      
    } else if (isOccasional) {
      // GESTIONE SPECIALE PER SPESE OCCASIONALI
      averageExpense = monthsWithExpenses > 0 ? parseFloat((totalExpense / monthsWithExpenses).toFixed(2)) : 0;
      methodUsed = 'occasional-expenses';
      explanation = `Spese occasionali rilevate: media sui ${monthsWithExpenses} mesi effettivi (€${averageExpense}/mese quando sostenute)`;
      console.log(`   🎯 DECISIONE SPECIALE: OCCASIONAL-EXPENSES - Non adatta per previsioni!`);
      
    } else if (monthsWithExpenses >= 9) {
      averageExpense = parseFloat((totalExpense / 12).toFixed(2));
      methodUsed = 'full-year';
      explanation = `Spese distribuite su ${monthsWithExpenses} mesi: media annuale`;
      
    } else if (monthsWithExpenses >= 3) {
      averageExpense = lastMonthWithExpense > 0 ? parseFloat((totalExpense / lastMonthWithExpense).toFixed(2)) : 0;
      methodUsed = 'last-month';
      explanation = `Spese in ${monthsWithExpenses} mesi: media fino al mese ${lastMonthWithExpense}`;
      
    } else {
      averageExpense = monthsWithExpenses > 0 ? parseFloat((totalExpense / monthsWithExpenses).toFixed(2)) : 0;
      methodUsed = 'actual-months';
      explanation = `Spese concentrate in ${monthsWithExpenses} mesi: media sui mesi effettivi`;
    }
    
    if (!isCurrentYear && !isOccasional && monthsWithExpenses < 3) {
      console.log(`   ✅ DECISIONE: ${methodUsed.toUpperCase()} (€${totalExpense} ÷ ${methodUsed.includes('actual') ? monthsWithExpenses : lastMonthWithExpense} = €${averageExpense}/mese)`);
    }
  }

  return { 
    averageExpense, 
    methodUsed, 
    explanation,
    isOccasional,
    reliability: isOccasional ? 'BASSA - Non rappresentativa per previsioni' : 'ALTA - Adatta per budget'
  };
}

// ===== TEST SPESE OCCASIONALI =====

console.log('🛍️ TEST SPESE OCCASIONALI/UNA TANTUM');
console.log('='.repeat(70));

const occasionalTests = [
  {
    name: 'ELETTRODOMESTICO - Acquisto una tantum (€2000 a marzo)',
    data: {
      totalExpense: 2000,
      monthlyData: {
        '01': { expense: 0 }, '02': { expense: 0 }, '03': { expense: 2000 },
        '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 0 },
        '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
      },
      options: { method: 'smart', currentYear: 2024 }
    }
  },
  {
    name: 'VACANZE - Due viaggi (€1500 luglio, €800 dicembre)',
    data: {
      totalExpense: 2300,
      monthlyData: {
        '01': { expense: 0 }, '02': { expense: 0 }, '03': { expense: 0 },
        '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 0 },
        '07': { expense: 1500 }, '08': { expense: 0 }, '09': { expense: 0 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 800 }
      },
      options: { method: 'smart', currentYear: 2024 }
    }
  },
  {
    name: 'AUTO - Riparazioni occasionali (€500, €300, €700)',
    data: {
      totalExpense: 1500,
      monthlyData: {
        '01': { expense: 0 }, '02': { expense: 500 }, '03': { expense: 0 },
        '04': { expense: 0 }, '05': { expense: 300 }, '06': { expense: 0 },
        '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 700 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
      },
      options: { method: 'smart', currentYear: 2024 }
    }
  },
  {
    name: 'MEDICO - Visite specialistiche sporadiche',
    data: {
      totalExpense: 800,
      monthlyData: {
        '01': { expense: 150 }, '02': { expense: 0 }, '03': { expense: 0 },
        '04': { expense: 200 }, '05': { expense: 0 }, '06': { expense: 0 },
        '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 450 },
        '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
      },
      options: { method: 'smart', currentYear: 2024 }
    }
  },
  {
    name: 'CONFRONTO - Affitto regolare (per riferimento)',
    data: {
      totalExpense: 12000,
      monthlyData: {
        '01': { expense: 1000 }, '02': { expense: 1000 }, '03': { expense: 1000 },
        '04': { expense: 1000 }, '05': { expense: 1000 }, '06': { expense: 1000 },
        '07': { expense: 1000 }, '08': { expense: 1000 }, '09': { expense: 1000 },
        '10': { expense: 1000 }, '11': { expense: 1000 }, '12': { expense: 1000 }
      },
      options: { method: 'smart', currentYear: 2024 }
    }
  }
];

occasionalTests.forEach((test, index) => {
  console.log(`\n${index + 1}️⃣ TEST: ${test.name}`);
  console.log('-'.repeat(60));
  console.log(`   💰 Totale spese: €${test.data.totalExpense}`);
  
  const result = calculateMonthlyAverageExpense(
    test.data.totalExpense,
    test.data.monthlyData,
    test.data.options
  );
  
  console.log(`   📊 Media calcolata: €${result.averageExpense}/mese`);
  console.log(`   🔧 Metodo usato: ${result.methodUsed}`);
  console.log(`   📝 Spiegazione: ${result.explanation}`);
  console.log(`   🎯 Affidabilità: ${result.reliability}`);
  
  if (result.isOccasional) {
    console.log(`   ⚠️  ATTENZIONE: Spese identificate come occasionali!`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('💡 CONCLUSIONI SPESE OCCASIONALI:');
console.log('• Il sistema rileva automaticamente pattern occasionali');
console.log('• Calcola la media sui mesi effettivi ma AVVISA della bassa affidabilità');
console.log('• Per spese una tantum, la "media mensile" è poco significativa');
console.log('• Meglio considerarle come budget annuale diviso per 12 mesi');
console.log('='.repeat(70));
