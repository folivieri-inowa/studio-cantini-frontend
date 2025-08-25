/**
 * Test finale delle spese occasionali - versione CommonJS per Node.js
 */

console.log('🛍️ COME SI COMPORTA CON LE SPESE OCCASIONALI');
console.log('='.repeat(70));

// Simulazione semplificata per il test
function analyzeExpensePattern(totalExpense, monthlyData, currentYear = 2024) {
  if (!totalExpense || totalExpense <= 0) return null;

  const monthsWithExpenses = Object.values(monthlyData).filter(d => d.expense > 0).length;
  const expenseAmounts = Object.values(monthlyData).map(d => d.expense || 0).filter(e => e > 0);
  const sparsityRatio = monthsWithExpenses / 12;
  
  // Rileva spese occasionali
  const avgWhenPresent = expenseAmounts.reduce((sum, amount) => sum + amount, 0) / expenseAmounts.length;
  const hasHighVariability = expenseAmounts.length > 1 && 
    (Math.max(...expenseAmounts) / Math.min(...expenseAmounts)) > 2.5;
  const hasSingleLargeAmount = expenseAmounts.some(amount => amount > avgWhenPresent * 2);
  const isOccasional = sparsityRatio <= 0.25 || 
    (monthsWithExpenses <= 3 && (hasHighVariability || hasSingleLargeAmount));

  let result;
  if (isOccasional) {
    // Approccio budget per spese occasionali
    const monthlyBudget = parseFloat((totalExpense / 12).toFixed(2));
    result = {
      average: monthlyBudget,
      method: 'OCCASIONAL-BUDGET',
      explanation: `Spese occasionali: accantona €${monthlyBudget}/mese per coprire €${totalExpense} annui`,
      reliability: 'MEDIA - Per budgeting',
      isOccasional: true,
      pattern: `${monthsWithExpenses} mesi attivi su 12 (${Math.round(sparsityRatio * 100)}%)`
    };
  } else if (monthsWithExpenses >= 9) {
    const yearlyAverage = parseFloat((totalExpense / 12).toFixed(2));
    result = {
      average: yearlyAverage,
      method: 'FULL-YEAR',
      explanation: `Spese regolari: €${yearlyAverage}/mese costanti`,
      reliability: 'ALTA - Previsione affidabile',
      isOccasional: false,
      pattern: `Distribuite su ${monthsWithExpenses} mesi`
    };
  } else {
    const lastMonth = Math.max(...Object.keys(monthlyData).filter(m => monthlyData[m].expense > 0).map(m => parseInt(m)));
    const periodAverage = parseFloat((totalExpense / lastMonth).toFixed(2));
    result = {
      average: periodAverage,
      method: 'SEASONAL',
      explanation: `Spese stagionali: €${periodAverage}/mese durante ${lastMonth} mesi attivi`,
      reliability: 'MEDIA - Periodo specifico',
      isOccasional: false,
      pattern: `Concentrate in ${monthsWithExpenses} mesi (fino al mese ${lastMonth})`
    };
  }

  return result;
}

const examples = [
  {
    name: '💻 LAPTOP',
    data: { totalExpense: 2000, monthlyData: { '01': {expense: 0}, '02': {expense: 0}, '03': {expense: 2000}, '04': {expense: 0}, '05': {expense: 0}, '06': {expense: 0}, '07': {expense: 0}, '08': {expense: 0}, '09': {expense: 0}, '10': {expense: 0}, '11': {expense: 0}, '12': {expense: 0} } },
    description: 'Acquisto singolo di valore elevato'
  },
  {
    name: '✈️ VACANZE',
    data: { totalExpense: 3000, monthlyData: { '01': {expense: 0}, '02': {expense: 0}, '03': {expense: 0}, '04': {expense: 0}, '05': {expense: 0}, '06': {expense: 1500}, '07': {expense: 0}, '08': {expense: 0}, '09': {expense: 0}, '10': {expense: 0}, '11': {expense: 1500}, '12': {expense: 0} } },
    description: 'Due viaggi durante l\'anno'
  },
  {
    name: '🔧 RIPARAZIONI',
    data: { totalExpense: 1800, monthlyData: { '01': {expense: 0}, '02': {expense: 600}, '03': {expense: 0}, '04': {expense: 0}, '05': {expense: 0}, '06': {expense: 700}, '07': {expense: 0}, '08': {expense: 0}, '09': {expense: 500}, '10': {expense: 0}, '11': {expense: 0}, '12': {expense: 0} } },
    description: 'Manutenzioni casa occasionali'
  },
  {
    name: '🏠 AFFITTO',
    data: { totalExpense: 12000, monthlyData: { '01': {expense: 1000}, '02': {expense: 1000}, '03': {expense: 1000}, '04': {expense: 1000}, '05': {expense: 1000}, '06': {expense: 1000}, '07': {expense: 1000}, '08': {expense: 1000}, '09': {expense: 1000}, '10': {expense: 1000}, '11': {expense: 1000}, '12': {expense: 1000} } },
    description: 'Spesa regolare mensile (confronto)'
  },
  {
    name: '🔥 RISCALDAMENTO',
    data: { totalExpense: 2400, monthlyData: { '01': {expense: 400}, '02': {expense: 400}, '03': {expense: 400}, '04': {expense: 0}, '05': {expense: 0}, '06': {expense: 0}, '07': {expense: 0}, '08': {expense: 0}, '09': {expense: 0}, '10': {expense: 400}, '11': {expense: 400}, '12': {expense: 400} } },
    description: 'Spesa stagionale invernale'
  }
];

examples.forEach((example, index) => {
  console.log(`\n${index + 1}. ${example.name}`);
  console.log(`   ${example.description}`);
  console.log(`   💰 Totale anno: €${example.data.totalExpense}`);
  
  const analysis = analyzeExpensePattern(example.data.totalExpense, example.data.monthlyData);
  
  if (analysis) {
    console.log(`   📊 Risultato: €${analysis.average}/mese`);
    console.log(`   🔧 Metodo: ${analysis.method}`);
    console.log(`   📝 Spiegazione: ${analysis.explanation}`);
    console.log(`   🎯 Affidabilità: ${analysis.reliability}`);
    console.log(`   📈 Pattern: ${analysis.pattern}`);
    
    if (analysis.isOccasional) {
      console.log(`   ⚠️  SPESA OCCASIONALE RILEVATA!`);
    }
  }
});

console.log('\n' + '='.repeat(70));
console.log('🎯 RIASSUNTO - GESTIONE SPESE OCCASIONALI:');
console.log('='.repeat(70));

console.log(`
📋 CRITERI DI IDENTIFICAZIONE:
• Spese presenti in ≤25% dei mesi dell'anno
• Importi molto variabili (>2.5x di differenza)  
• Importi singoli elevati rispetto alla media

🧮 STRATEGIE DI CALCOLO:
• OCCASIONAL-BUDGET: Totale ÷ 12 mesi (per accantonamento)
• SEASONAL: Concentrata in periodo specifico
• FULL-YEAR: Distribuzione regolare

💡 CONSIGLI PRATICI:
• Spese occasionali → Accantona mensilmente per coprire il costo annuo
• Spese regolari → Budget mensile fisso
• Spese stagionali → Pianifica per il periodo attivo

⚠️  IMPORTANTE:
Per spese occasionali/una tantum, la "media mensile" serve principalmente
per il BUDGETING (quanto accantonare ogni mese), NON per prevedere
l'importo mensile effettivo delle spese!
`);

console.log('='.repeat(70));
