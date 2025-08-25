/**
 * SPIEGAZIONE DETTAGLIATA: Come il metodo SMART sceglie quale formula usare
 * 
 * Il sistema analizza 3 fattori chiave:
 * 1. Se stiamo analizzando l'anno corrente o un anno passato
 * 2. In quanti mesi ci sono state spese (distribuzione)
 * 3. Qual è l'ultimo mese con spese
 */

// ===== REGOLE DI DECISIONE =====

console.log('🤖 LOGICA DEL METODO SMART');
console.log('='.repeat(50));

const decisionRules = {
  step1: {
    condition: 'Anno corrente (2025)',
    action: 'Usa CURRENT-PERIOD',
    formula: 'Totale ÷ Mesi trascorsi fino ad oggi',
    reasoning: 'Non ha senso dividere per mesi futuri che non sono ancora accaduti'
  },
  
  step2: {
    condition: 'Anno passato + Spese in ≥9 mesi',
    action: 'Usa FULL-YEAR', 
    formula: 'Totale ÷ 12 mesi',
    reasoning: 'Le spese sono ben distribuite, la media annuale è rappresentativa'
  },
  
  step3: {
    condition: 'Anno passato + Spese in 3-8 mesi',
    action: 'Usa LAST-MONTH',
    formula: 'Totale ÷ Ultimo mese con spese',
    reasoning: 'Le spese sono parzialmente concentrate, meglio non diluire su tutto l\'anno'
  },
  
  step4: {
    condition: 'Anno passato + Spese in <3 mesi',
    action: 'Usa ACTUAL-MONTHS',
    formula: 'Totale ÷ Solo mesi con spese',
    reasoning: 'Spese molto concentrate, media sui mesi effettivi più accurata'
  }
};

Object.entries(decisionRules).forEach(([step, rule]) => {
  console.log(`\n📋 ${step.toUpperCase()}:`);
  console.log(`   Condizione: ${rule.condition}`);
  console.log(`   Azione: ${rule.action}`);
  console.log(`   Formula: ${rule.formula}`);
  console.log(`   Perché: ${rule.reasoning}`);
});

// ===== ESEMPI PRATICI =====

console.log(`\n${'='.repeat(50)}`);
console.log('📊 ESEMPI PRATICI CON SPIEGAZIONE PASSO-PASSO');
console.log('='.repeat(50));

const examples = [
  {
    name: 'TASSE - Anno passato (2024)',
    scenario: {
      year: 2024,
      currentYear: 2025,
      totalExpense: 3000,
      monthlyData: {
        '01': 1000, '02': 1000, '03': 1000,  // Solo primi 3 mesi
        '04': 0, '05': 0, '06': 0, '07': 0, '08': 0, '09': 0, '10': 0, '11': 0, '12': 0
      }
    }
  },
  {
    name: 'AFFITTO - Anno passato (2024)', 
    scenario: {
      year: 2024,
      currentYear: 2025,
      totalExpense: 12000,
      monthlyData: {
        '01': 1000, '02': 1000, '03': 1000, '04': 1000, '05': 1000, '06': 1000,
        '07': 1000, '08': 1000, '09': 1000, '10': 1000, '11': 1000, '12': 1000
      }
    }
  },
  {
    name: 'SPESE CORRENTI - Anno 2025 (in corso)',
    scenario: {
      year: 2025,
      currentYear: 2025,
      totalExpense: 4000,
      monthlyData: {
        '01': 500, '02': 500, '03': 500, '04': 500, '05': 500, '06': 500, '07': 500, '08': 500,
        '09': 0, '10': 0, '11': 0, '12': 0  // Mesi futuri
      }
    }
  },
  {
    name: 'RISCALDAMENTO - Anno passato (2024)',
    scenario: {
      year: 2024,
      currentYear: 2025,
      totalExpense: 2400,
      monthlyData: {
        '01': 400, '02': 400, '03': 400, '04': 200, '05': 0, '06': 0,
        '07': 0, '08': 0, '09': 0, '10': 200, '11': 400, '12': 400
      }
    }
  }
];

examples.forEach((example, index) => {
  console.log(`\n🔍 ESEMPIO ${index + 1}: ${example.name}`);
  console.log('-'.repeat(40));
  
  const { year, currentYear, totalExpense, monthlyData } = example.scenario;
  
  // STEP 1: Calcola statistiche
  const monthsWithExpenses = Object.values(monthlyData).filter(amount => amount > 0).length;
  const lastMonthWithExpense = Math.max(
    ...Object.entries(monthlyData)
      .filter(([, amount]) => amount > 0)
      .map(([month]) => parseInt(month, 10))
  );
  const isCurrentYear = year === currentYear;
  const currentMonth = 8; // Agosto 2025
  
  console.log(`📊 Dati di base:`);
  console.log(`   • Totale spese: €${totalExpense}`);
  console.log(`   • Mesi con spese: ${monthsWithExpenses}/12`);
  console.log(`   • Ultimo mese con spese: ${lastMonthWithExpense}`);
  console.log(`   • È anno corrente: ${isCurrentYear ? 'SI' : 'NO'}`);
  
  // STEP 2: Applica la logica di decisione
  let method;
  let divisor;
  let reasoning;
  
  if (isCurrentYear) {
    method = 'CURRENT-PERIOD';
    divisor = Math.min(currentMonth, lastMonthWithExpense);
    reasoning = `È l'anno corrente. Divido per i ${divisor} mesi trascorsi fino ad oggi.`;
  } else if (monthsWithExpenses >= 9) {
    method = 'FULL-YEAR';
    divisor = 12;
    reasoning = `Anno passato con spese in ${monthsWithExpenses} mesi (≥9). Le spese sono ben distribuite, uso la media annuale.`;
  } else if (monthsWithExpenses >= 3) {
    method = 'LAST-MONTH';
    divisor = lastMonthWithExpense;
    reasoning = `Anno passato con spese in ${monthsWithExpenses} mesi (3-8). Spese parzialmente concentrate, divido per l'ultimo mese (${lastMonthWithExpense}).`;
  } else {
    method = 'ACTUAL-MONTHS';
    divisor = monthsWithExpenses;
    reasoning = `Anno passato con spese in soli ${monthsWithExpenses} mesi (<3). Molto concentrate, divido solo per i mesi effettivi.`;
  }
  
  const average = Math.round((totalExpense / divisor) * 100) / 100;
  
  console.log(`\n🧮 Decisione algoritmo:`);
  console.log(`   • Metodo scelto: ${method}`);
  console.log(`   • Formula: €${totalExpense} ÷ ${divisor} = €${average}`);
  console.log(`   • Ragionamento: ${reasoning}`);
});

console.log(`\n${'='.repeat(50)}`);
console.log('💡 RIASSUNTO DELLE REGOLE:');
console.log('='.repeat(50));
console.log(`
1️⃣ ANNO CORRENTE → Usa mesi trascorsi
   Perché: Non possiamo prevedere il futuro

2️⃣ SPESE DISTRIBUITE (≥9 mesi) → Media su 12 mesi  
   Perché: Pattern regolare, media annuale rappresentativa
   
3️⃣ SPESE PARZIALI (3-8 mesi) → Ultimo mese con spese
   Perché: Evita di diluire su periodi inattivi
   
4️⃣ SPESE CONCENTRATE (<3 mesi) → Solo mesi effettivi
   Perché: Massima precisione per spese molto concentrate
`);
