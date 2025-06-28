// File: api/scadenziario-services.js
import useSWR from 'swr';

import axios from '../utils/axios';

// URL degli endpoint
const API_URLS = {
  list: '/api/scadenziario/list',
  details: '/api/scadenziario/details',
  create: '/api/scadenziario/create',
  update: '/api/scadenziario/update',
  delete: '/api/scadenziario/delete',
  updatePayment: '/api/scadenziario/update-payment'
};

// ----------------------------------------------------------------------
// Funzioni API base
// ----------------------------------------------------------------------

/**
 * Recupera l'elenco di tutte le scadenze, con supporto per filtri
 * @param {Object} filters - Oggetto contenente i filtri (opzionale)
 * @returns {Promise<Object>} - Promise con i dati delle scadenze
 */
export async function getScadenziarioList(filters = {}) {
  try {
    console.log('Richiesta API scadenziario con filtri:', filters);
    const response = await axios.post(API_URLS.list, { filters });
    
    // Verifica che la risposta sia nel formato atteso
    if (response.data && response.data.data) {
      console.log(`Ricevuti ${Array.isArray(response.data.data) ? response.data.data.length : 'non-array'} record dallo scadenziario`);
      
      // Verifica e normalizza i record
      if (Array.isArray(response.data.data)) {
        // Logga gli importi per debug
        response.data.data.forEach((item, index) => {
          if (!item || !item.id || !item.subject || !item.date) {
            console.warn(`Record #${index} potenzialmente problematico:`, item);
          } else {
            console.log(`Record #${index} - id: ${item.id}, subject: ${item.subject}, amount: ${item.amount} (type: ${typeof item.amount})`);
          }
        });
        
        // Converti gli importi da stringa a numero
        response.data.data = response.data.data.map(item => {
          if (!item) return item;
          return {
            ...item,
            amount: item.amount ? parseFloat(item.amount) : 0
          };
        });
      }
    } else {
      console.warn('Formato risposta API non standard:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero delle scadenze:', error);
    throw error;
  }
}

/**
 * Recupera i dettagli di una specifica scadenza
 * @param {string} id - ID della scadenza
 * @returns {Promise<Object>} - Promise con i dettagli della scadenza
 */
export async function getScadenziarioDetails(id) {
  try {
    const response = await axios.post(API_URLS.details, { id });
    
    // Normalizza i dati convertendo gli importi da stringa a numero
    if (response.data && response.data.data) {
      const item = response.data.data;
      console.log(`Dettagli scadenza - id: ${item.id}, subject: ${item.subject}, amount: ${item.amount} (type: ${typeof item.amount})`);
      
      // Converti l'importo da stringa a numero e gestisci la consistenza dei campi
      response.data.data = {
        ...item,
        amount: item.amount ? parseFloat(item.amount) : 0,
        // Assicura consistenza tra payment_date e paymentDate
        paymentDate: item.payment_date || item.paymentDate
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei dettagli della scadenza:', error);
    throw error;
  }
}

/**
 * Crea una nuova scadenza
 * @param {Object} scadenza - Dati della nuova scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza creata
 */
export async function createScadenziario(scadenza) {
  try {
    const response = await axios.post(API_URLS.create, { scadenza });
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione della scadenza:', error);
    throw error;
  }
}

/**
 * Aggiorna una scadenza esistente
 * @param {string} id - ID della scadenza da aggiornare
 * @param {Object} scadenza - Dati aggiornati della scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza aggiornata
 */
export async function updateScadenziario(id, scadenza) {
  try {
    const response = await axios.post(API_URLS.update, { id, scadenza });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento della scadenza:', error);
    throw error;
  }
}

/**
 * Aggiorna solo lo stato di pagamento di una scadenza
 * @param {string} id - ID della scadenza
 * @param {string} payment_date - Data di pagamento (formato YYYY-MM-DD)
 * @param {string} status - Nuovo stato della scadenza
 * @returns {Promise<Object>} - Promise con i dati della scadenza aggiornata
 */
export async function updatePaymentStatus(id, payment_date, status = 'completed') {
  try {
    const response = await axios.post(API_URLS.updatePayment, { id, payment_date, status });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato di pagamento:', error);
    throw error;
  }
}

/**
 * Elimina una scadenza
 * @param {string} id - ID della scadenza da eliminare
 * @returns {Promise<Object>} - Promise con l'esito dell'eliminazione
 */
export async function deleteScadenziario(id) {
  try {
    const response = await axios.post(API_URLS.delete, { id });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione della scadenza:', error);
    throw error;
  }
}

/**
 * Elimina più scadenze contemporaneamente
 * @param {Array<string>} ids - Array di ID delle scadenze da eliminare
 * @returns {Promise<Object>} - Promise con l'esito dell'eliminazione
 */
export async function deleteMultipleScadenze(ids) {
  try {
    const response = await axios.post(API_URLS.deleteMultiple, { ids });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione di multiple scadenze:', error);
    throw error;
  }
}

/**
 * Aggiorna automaticamente lo stato di tutte le scadenze in base alle date
 * @returns {Promise<Object>} - Promise con l'esito dell'aggiornamento
 */
export async function updateAllStatus() {
  try {
    const response = await axios.post('/api/scadenziario/update-status', {});
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento automatico degli stati:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------
// Hook SWR per integrazione con React
// ----------------------------------------------------------------------

/**
 * Hook per recuperare l'elenco delle scadenze con filtri opzionali
 * @param {Object} filters - Filtri da applicare alla query
 */
export function useGetScadenziario(filters = {}) {
  // Crea una chiave unica per SWR che cambia quando cambiano i filtri
  const swrKey = JSON.stringify(['scadenziario-list', filters]);
  
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async () => {
      try {
        const response = await getScadenziarioList(filters);
        
        // Log per diagnosticare problemi
        console.log('Dati ricevuti dal server:', response);
        
        return response;
      } catch (err) {
        console.error('Errore durante il recupero delle scadenze:', err);
        throw err;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0, // Disabilita il deduping per garantire dati freschi ogni volta
    }
  );

  // Estrai i dati e assicurati che siano un array valido
  let scadenziario = [];
  if (data && data.data) {
    if (Array.isArray(data.data)) {
      scadenziario = data.data;
    } else {
      console.error('I dati ricevuti non sono un array:', data.data);
      // Tenta di convertire in array se possibile
      scadenziario = Object.values(data.data);
    }
  }

  return {
    scadenziario,
    scadenziarioLoading: isLoading,
    scadenziarioError: error,
    scadenziarioEmpty: !isLoading && !scadenziario.length,
    scadenziarioMutate: mutate,
    scadenziarioOriginalData: data, // Include i dati originali per debugging
  };
}

/**
 * Hook per recuperare i dettagli di una singola scadenza
 * @param {string} id - ID della scadenza
 */
export function useGetScadenziarioItem(id) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `scadenziario-detail-${id}` : null,
    async () => {
      try {
        return await getScadenziarioDetails(id);
      } catch (err) {
        console.error('Errore durante il recupero dei dettagli della scadenza:', err);
        throw err;
      }
    },
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );
  
  const item = data?.data || {};

  return {
    scadenziarioItem: item,
    scadenziarioItemLoading: isLoading,
    scadenziarioItemError: error,
    scadenziarioItemMutate: mutate,
  };
}
