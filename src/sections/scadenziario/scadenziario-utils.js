/**
 * Funzioni di utilità per la gestione dello scadenziario
 */

/**
 * Calcola lo stato di un elemento dello scadenziario in base alla data di scadenza
 * @param {Date} dueDate - Data di scadenza
 * @param {Date|null} paymentDate - Data di pagamento (se pagato)
 * @returns {string} - Stato calcolato (completed, overdue, upcoming, future)
 */
export function calculateScadenziarioStatus(dueDate, paymentDate) {
  // Se c'è una data di pagamento, lo stato è sempre "completed" (pagato)
  if (paymentDate) {
    return 'completed';
  }
  
  const today = new Date();
  const diffTime = new Date(dueDate) - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'overdue';    // Scaduto (oltre la data odierna)
  } 
  
  if (diffDays <= 15) {
    return 'upcoming';   // In scadenza (meno di 15 giorni)
  } 
  
  return 'future';     // Da pagare (più di 15 giorni)
}

/**
 * Formatta un importo come valuta Euro
 * @param {number|string} amount - Importo da formattare (numero o stringa)
 * @returns {string} - Stringa formattata (es. "€ 123,45")
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) {
    return '€ 0,00';
  }
  try {
    // Converti in numero se è una stringa
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Verifica se è un numero valido
    if (Number.isNaN(numericAmount)) {
      console.warn('Valore non numerico:', amount);
      return '€ 0,00';
    }
    
    return numericAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
  } catch (error) {
    console.error('Errore nella formattazione della valuta:', error, amount);
    return '€ 0,00';
  }
}

/**
 * Funzione per aggiornare lo stato degli elementi dello scadenziario
 * @param {Array|Object} items - Array di elementi o singolo elemento dello scadenziario
 * @returns {Array|Object} - Array di elementi o singolo elemento con stato aggiornato
 */
export function updateScadenziarioStatus(items) {
  // Gestione singolo elemento
  if (items && !Array.isArray(items)) {
    const item = items;
    
    // Calcola lo stato solo se non è già stato pagato
    if (item.payment_date || item.paymentDate) {
      return { ...item, status: 'completed' };
    }
    
    const currentStatus = calculateScadenziarioStatus(item.date, null);
    
    // Aggiorna lo stato solo se necessario
    if (item.status !== currentStatus) {
      return { ...item, status: currentStatus };
    }
    
    return item;
  }
  
  // Gestione array di elementi
  if (!items || !Array.isArray(items)) return [];
  
  return items.map(item => {
    // Calcola lo stato solo se non è già stato pagato
    if (item.payment_date || item.paymentDate) {
      return { ...item, status: 'completed' };
    }
    
    const currentStatus = calculateScadenziarioStatus(item.date, null);
    
    // Aggiorna lo stato solo se necessario
    if (item.status !== currentStatus) {
      return { ...item, status: currentStatus };
    }
    
    return item;
  });
}
