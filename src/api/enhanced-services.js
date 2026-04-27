// Enhanced services for scadenziario
import useSWR from 'swr';

import { getScadenziarioList } from './scadenziario-services';

function computeStatus(date, paymentDate, alertDays = 15) {
  if (paymentDate) return 'completed';
  if (!date) return 'future';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= alertDays) return 'upcoming';
  return 'future';
}

/**
 * Hook migliorato per recuperare l'elenco delle scadenze con gestione robusta degli errori
 * @param {Object} filters - Filtri da applicare alla query
 */
export function useEnhancedGetScadenziario(filters = {}) {
  // Crea una chiave unica per SWR che cambia quando cambiano i filtri
  const swrKey = JSON.stringify(['scadenziario-enhanced-list', filters]);
  
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      try {
        const response = await getScadenziarioList(filters);
        
        // Debug avanzato per diagnosticare problemi con gli importi
        console.log('Dati scadenziario ricevuti dal server:', response);
        
        // Verifica dettagliata del formato degli importi
        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((item, index) => {
            console.log(`Record #${index} - id: ${item.id}, subject: ${item.subject}, amount: ${item.amount} (type: ${typeof item.amount})`);
          });
          
          // Converti gli importi da stringa a numero
          response.data = response.data.map(item => ({
            ...item,
            amount: item.amount ? parseFloat(item.amount) : 0
          }));
          
          console.log('Dati dopo conversione importi:', response.data);
        }
        
        return response;
      } catch (error) {
        console.error('Errore durante il recupero delle scadenze:', error);
        throw error;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // dedupingInterval: 0, // Disabilita il caching per garantire dati freschi ogni volta
    }
  );

  // Gestione sicura dei dati
  let scadenziario = [];
  let originalData = null;
  
  if (data) {
    originalData = data;
    
    if (data.data) {
      if (Array.isArray(data.data)) {
        // Se è già un array, filtriamo elementi nulli e trasformiamo i campi
        scadenziario = data.data
          .filter(item => item != null)
          .map(item => {
            const paymentDate = item.payment_date || item.paymentDate || null;
            const alertDays = item.alert_days ?? 15;
            return {
              ...item,
              paymentDate,
              invoiceDate: item.invoice_date || null,
              invoiceNumber: item.invoice_number || null,
              companyName: item.company_name || null,
              vatNumber: item.vat_number || null,
              paymentTerms: item.payment_terms || null,
              attachmentUrl: item.attachment_url || null,
              groupId: item.group_id || null,
              alertDays,
              amount: typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount || 0),
              status: computeStatus(item.date, paymentDate, alertDays),
            };
          });
          
        if (scadenziario.length < data.data.length) {
          console.warn(`Filtrati ${data.data.length - scadenziario.length} elementi nulli`);
        }
      } else if (typeof data.data === 'object') {
        // Se è un oggetto, proviamo a convertirlo in array
        try {
          scadenziario = Object.values(data.data).filter(item => item != null);
          console.warn('Dati convertiti da oggetto ad array:', scadenziario);
        } catch (e) {
          console.error('Impossibile convertire i dati in array:', e);
        }
      }
    }
  }

  return {
    scadenziario,
    scadenziarioLoading: isLoading,
    scadenziarioError: error,
    scadenziarioEmpty: !isLoading && !scadenziario.length,
    scadenziarioMutate: mutate,
    scadenziarioOriginalData: originalData, // Per debug
  };
}
