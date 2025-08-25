/**
 * Demo script to show different calculation methods for monthly expenses
 * Run this to see how different approaches work with various expense patterns
 */

import { calculateMonthlyAverageExpense } from './expense-calculations';

// Test scenarios
const scenarios = [
  {
    name: 'Spese concentrate nei primi 3 mesi (es. tasse)',
    totalExpense: 1200,
    monthlyData: {
      '01': { expense: 400 },
      '02': { expense: 400 },
      '03': { expense: 400 },
      '04': { expense: 0 },
      '05': { expense: 0 },
      '06': { expense: 0 },
      '07': { expense: 0 },
      '08': { expense: 0 },
      '09': { expense: 0 },
      '10': { expense: 0 },
      '11': { expense: 0 },
      '12': { expense: 0 }
    }
  },
  {
    name: 'Spese distribuite tutto l\'anno (es. affitto)',
    totalExpense: 1200,
    monthlyData: {
      '01': { expense: 100 }, '02': { expense: 100 }, '03': { expense: 100 },
      '04': { expense: 100 }, '05': { expense: 100 }, '06': { expense: 100 },
      '07': { expense: 100 }, '08': { expense: 100 }, '09': { expense: 100 },
      '10': { expense: 100 }, '11': { expense: 100 }, '12': { expense: 100 }
    }
  },
  {
    name: 'Spese stagionali (es. riscaldamento)',
    totalExpense: 800,
    monthlyData: {
      '01': { expense: 200 }, '02': { expense: 200 }, '03': { expense: 100 },
      '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 0 },
      '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
      '10': { expense: 100 }, '11': { expense: 100 }, '12': { expense: 100 }
    }
  },
  {
    name: 'Anno corrente in corso (oggi agosto)',
    totalExpense: 800,
    monthlyData: {
      '01': { expense: 100 }, '02': { expense: 100 }, '03': { expense: 100 },
      '04': { expense: 100 }, '05': { expense: 100 }, '06': { expense: 100 },
      '07': { expense: 100 }, '08': { expense: 100 }, '09': { expense: 0 },
      '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
    }
  }
];

const methods = ['smart', 'last-month', 'full-year', 'actual-months'];

console.log('🧮 CONFRONTO METODI DI CALCOLO MEDIA MENSILE\n');
console.log('='.repeat(80));

scenarios.forEach((scenario, index) => {
  console.log(`\n📊 SCENARIO ${index + 1}: ${scenario.name}`);
  console.log(`💰 Totale spese annue: €${scenario.totalExpense}`);
  console.log('-'.repeat(60));

  methods.forEach(method => {
    const result = calculateMonthlyAverageExpense(
      scenario.totalExpense, 
      scenario.monthlyData, 
      { 
        method, 
        currentYear: 2025, 
        currentMonth: 8 // Agosto
      }
    );

    console.log(`${method.toUpperCase().padEnd(15)} | €${result.averageExpense.toString().padEnd(8)} | ${result.explanation}`);
  });
});

console.log(`\n${'='.repeat(80)}`);
console.log('💡 CONCLUSIONI:');
console.log('• SMART: Metodo intelligente che si adatta al contesto');
console.log('• LAST-MONTH: Metodo attuale (divide per ultimo mese con spese)');
console.log('• FULL-YEAR: Divide sempre per 12 mesi');
console.log('• ACTUAL-MONTHS: Divide solo per mesi con spese effettive');
console.log('\n🎯 RACCOMANDAZIONE: Usa il metodo SMART per massima accuratezza!');
