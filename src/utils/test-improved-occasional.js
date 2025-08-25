/**
 * Test della versione migliorata per spese occasionali
 * Mostra come il sistema gestisce intelligentemente acquisti una tantum
 */

// Import the improved function
import { calculateMonthlyAverageExpense } from './expense-calculations';

console.log('🛍️ TEST VERSIONE MIGLIORATA - GESTIONE SPESE OCCASIONALI');
console.log('='.repeat(80));

const improvedTests = [
  {
    name: 'LAPTOP - Acquisto una tantum €1500',
    totalExpense: 1500,
    monthlyData: {
      '01': { expense: 0 }, '02': { expense: 0 }, '03': { expense: 0 },
      '04': { expense: 0 }, '05': { expense: 1500 }, '06': { expense: 0 },
      '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
      '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
    },
    scenario: 'Acquisto singolo di valore elevato'
  },
  {
    name: 'VACANZE - Due viaggi €800 + €1200',
    totalExpense: 2000,
    monthlyData: {
      '01': { expense: 0 }, '02': { expense: 0 }, '03': { expense: 0 },
      '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 800 },
      '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 0 },
      '10': { expense: 0 }, '11': { expense: 1200 }, '12': { expense: 0 }
    },
    scenario: 'Spese ricreative sporadiche'
  },
  {
    name: 'RIPARAZIONI CASA - Lavori occasionali',
    totalExpense: 3000,
    monthlyData: {
      '01': { expense: 0 }, '02': { expense: 800 }, '03': { expense: 0 },
      '04': { expense: 0 }, '05': { expense: 0 }, '06': { expense: 1200 },
      '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 1000 },
      '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
    },
    scenario: 'Manutenzioni irregolari ma necessarie'
  },
  {
    name: 'SPESE MEDICHE - Visite specialistiche',
    totalExpense: 600,
    monthlyData: {
      '01': { expense: 150 }, '02': { expense: 0 }, '03': { expense: 0 },
      '04': { expense: 200 }, '05': { expense: 0 }, '06': { expense: 0 },
      '07': { expense: 0 }, '08': { expense: 0 }, '09': { expense: 250 },
      '10': { expense: 0 }, '11': { expense: 0 }, '12': { expense: 0 }
    },
    scenario: 'Spese sanitarie non programmate'
  },
  {
    name: 'CONFRONTO - Assicurazione regolare',
    totalExpense: 1200,
    monthlyData: {
      '01': { expense: 100 }, '02': { expense: 100 }, '03': { expense: 100 },
      '04': { expense: 100 }, '05': { expense: 100 }, '06': { expense: 100 },
      '07': { expense: 100 }, '08': { expense: 100 }, '09': { expense: 100 },
      '10': { expense: 100 }, '11': { expense: 100 }, '12': { expense: 100 }
    },
    scenario: 'Spese regolari mensili (per confronto)'
  }
];

improvedTests.forEach((test, index) => {
  console.log(`\n${index + 1}️⃣ ${test.name}`);
  console.log(`📝 Scenario: ${test.scenario}`);
  console.log('-'.repeat(70));
  console.log(`💰 Totale spese anno: €${test.totalExpense}`);
  
  // Test con anno passato
  const result = calculateMonthlyAverageExpense(test.totalExpense, test.monthlyData, {
    method: 'smart',
    currentYear: 2024,
    currentMonth: 8
  });
  
  console.log(`📊 RISULTATO SMART ALGORITHM:`);
  console.log(`   • Media mensile: €${result.averageExpense}/mese`);
  console.log(`   • Metodo usato: ${result.methodUsed.toUpperCase()}`);
  console.log(`   • Spiegazione: ${result.explanation}`);
  console.log(`   • Affidabilità: ${result.reliability}`);
  
  if (result.isOccasional) {
    console.log(`   ⚠️  Identificata come spesa OCCASIONALE`);
  }
  
  if (result.budgetSuggestion) {
    console.log(`   💡 Suggerimento: ${result.budgetSuggestion}`);
  }
  
  // Mostra debug info per spese occasionali
  if (result.isOccasional) {
    console.log(`   🔍 Debug info:`, {
      mesiConSpese: result.debugInfo.monthsWithExpenses,
      sparseRatio: `${result.debugInfo.sparsityRatio}%`,
      variabilitàAlta: result.debugInfo.hasHighVariability
    });
  }
});

console.log(`\n${'='.repeat(80)}`);
console.log('💡 COME GESTISCE LE SPESE OCCASIONALI LA VERSIONE MIGLIORATA:');
console.log('='.repeat(80));

console.log(`
🔍 RILEVAMENTO AUTOMATICO:
• Analizza la distribuzione delle spese (≤25% dei mesi = occasionale)
• Rileva variabilità negli importi (differenze >2.5x)
• Identifica importi singoli elevati

🧮 STRATEGIE DI CALCOLO:
• OCCASIONAL-BUDGET: Distribuisce il totale su 12 mesi per il budget
• Esempio: €1500 una tantum → €125/mese da accantonare

📊 LIVELLI DI AFFIDABILITÀ:
• ALTA: Spese regolari, previsioni accurate
• MEDIA: Spese stagionali/occasionali, previsioni moderate  
• BASSA: Spese irregolari, previsioni difficili

💡 SUGGERIMENTI PERSONALIZZATI:
• Per spese regolari: budget mensile fisso
• Per spese occasionali: accantonamento mensile
• Per spese irregolari: fondo di emergenza

🎯 VANTAGGI:
✅ Riconosce automaticamente i pattern di spesa
✅ Fornisce consigli di budgeting appropriati
✅ Evita false aspettative su spese irregolari
✅ Distingue tra spese ricorrenti e una tantum
`);

console.log('='.repeat(80));
