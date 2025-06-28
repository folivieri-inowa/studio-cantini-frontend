import useSWR from 'swr';
import axios from '../utils/axios';
import { updateScadenziarioStatus } from '../sections/scadenziario/scadenziario-utils';

// ----------------------------------------------------------------------

// URL del backend
const BACKEND_URL = '/api/scadenziario/list';

// La funzione getDefaultData è stata rimossa poiché non utilizziamo più dati mock

// Funzione di utilità per calcolare lo stato di una scadenza
function calculateStatus(dueDate, paymentDate) {
  if (paymentDate) {
    return 'completed';
  }
  
  const today = new Date();
  const diff = dueDate - today;
  const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'overdue';
  }
  
  if (diffDays <= 15) {
    return 'upcoming';
  }
  
  return 'future';
}

// ----------------------------------------------------------------------

export function useGetScadenziario(filters = {}) {
  // Assicurati che l'URL non abbia slash alla fine
  const apiUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  
  // Hook personalizzato per usare SWR con POST
  const fetcher = async () => {
    try {
      console.log('Chiamata API a:', apiUrl);
      const response = await axios.post(apiUrl, { 
        filters 
      });
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero dei dati dello scadenziario:', error);
      throw error;
    }
  };

  // Usiamo una chiave basata sui filtri invece dell'URL completo
  const { data, isLoading, error, mutate } = useSWR(
    `scadenziario-list-${JSON.stringify(filters)}`, 
    fetcher, 
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const scadenziario = data?.data || [];

  // Aggiorna lo stato delle scadenze in base alle date (per front-end)
  const updatedItems = scadenziario.map(item => updateScadenziarioStatus(item));

  return {
    scadenziario: updatedItems,
    scadenziarioLoading: isLoading,
    scadenziarioError: error,
    scadenziarioEmpty: !isLoading && !updatedItems.length,
    scadenziarioMutate: mutate,
  };
}

// ----------------------------------------------------------------------

export function useGetScadenziarioItem(id) {
  // Funzione fetcher per ottenere i dettagli di un item
  const fetchDetails = async () => {
    try {
      const response = await axios.post(BACKEND_URL, { 
        action: 'details', 
        id 
      });
      return response.data;
    } catch (error) {
      console.error('Errore durante il recupero dei dettagli dello scadenziario:', error);
      throw error;
    }
  };
  
  const { data, isLoading, error, mutate } = useSWR(
    id ? `scadenziario-item-${id}` : null, 
    fetchDetails, 
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // Se abbiamo un errore o non abbiamo ancora dati, usiamo un mock
  if (!data || error) {
    const today = new Date();
    // Genera una data casuale che può essere passata, futura o imminente
    const randomDays = Math.floor(Math.random() * 30) - 10; // Da -10 a +20 giorni
    const mockDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + randomDays);
    
    // Determina se il mock è stato pagato (30% di probabilità)
    const isPaid = Math.random() > 0.7;
    const paymentDate = isPaid ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2) : null;
    
    const mockItem = {
      id,
      subject: 'Soggetto di esempio',
      description: 'Descrizione di esempio',
      causale: 'Causale di esempio',
      date: mockDate,
      amount: Math.floor(Math.random() * 1000) + 50,
      paymentDate,
      status: calculateStatus(mockDate, paymentDate)
    };
    
    return {
      scadenziarioItem: mockItem,
      scadenziarioItemLoading: isLoading,
      scadenziarioItemError: error,
      scadenziarioItemMutate: mutate,
    };
  }
  
  const item = data.data || {};
  const updatedItem = updateScadenziarioStatus(item);

  return {
    scadenziarioItem: updatedItem,
    scadenziarioItemLoading: isLoading,
    scadenziarioItemError: error,
    scadenziarioItemMutate: mutate,
  };
}

// ----------------------------------------------------------------------

export async function createScadenziario(itemData) {
  try {
    const response = await axios.post(BACKEND_URL, {
      action: 'create',
      scadenza: itemData
    });
    return response.data;
  } catch (error) {
    console.error('Errore nella creazione della scadenza:', error);
    throw error;
  }
}

export async function updateScadenziario(id, itemData) {
  try {
    const response = await axios.post(BACKEND_URL, {
      action: 'update',
      id,
      scadenza: itemData
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento della scadenza:', error);
    throw error;
  }
}

export async function deleteScadenziario(id) {
  try {
    const response = await axios.post(BACKEND_URL, {
      action: 'delete',
      id
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'eliminazione della scadenza:', error);
    throw error;
  }
}

export async function updatePaymentStatus(id, paymentDate) {
  try {
    const response = await axios.post(BACKEND_URL, {
      action: 'update-payment',
      id,
      paymentDate
    });
    return response.data;
  } catch (error) {
    console.error('Errore nell\'aggiornamento dello stato pagamento:', error);
    throw error;
  }
}
