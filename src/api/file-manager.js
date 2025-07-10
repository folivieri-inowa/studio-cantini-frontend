import axios from 'axios';
import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export function useGetFileManager(db) {
  const URL = [endpoints.file_manager.list, { params: { db } }]

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      fileManager: data?.data || [],
      fileManagerLoading: isLoading,
      fileManagerError: error,
      fileManagerValidating: isValidating,
      fileManagerEmpty: !isLoading && !data?.data.length,
      refetch: () => {
        // Forza una rivalidazione completa
        mutate(URL, undefined, { revalidate: true });
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------

// Hook per ottenere le informazioni di un file (transazioni associate, ecc.)
export function useGetFileInfo(db, fileUrl) {
  const URL = fileUrl ? [endpoints.file_manager.fileInfo, { params: { db, fileUrl } }] : null;

  const { data, isLoading, error } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      fileInfo: data?.data,
      fileInfoLoading: isLoading,
      fileInfoError: error,
      isLinked: data?.data?.isLinked || false,
      transactions: data?.data?.transactions || [],
    }),
    [data?.data, error, isLoading]
  );
}

// ----------------------------------------------------------------------

// Funzioni per operazioni dirette (non hooks)

// Funzione per caricare un file
export async function uploadFile(db, file, categoryId, subjectId = null, detailId = null) {
  try {
    console.log('=== FRONTEND: Iniziando upload ===');
    console.log('Parametri ricevuti nella funzione uploadFile:');
    console.log('  - db:', db);
    console.log('  - file:', file?.name, 'size:', file?.size);
    console.log('  - categoryId:', categoryId);
    console.log('  - subjectId:', subjectId);
    console.log('  - detailId:', detailId);
    
    const formData = new FormData();
    formData.append('file', file);

    // Chiama direttamente il backend usando l'endpoint corretto
    const backendUrl = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:3031';
    const url = `${backendUrl}/v1/file-manager/upload/${db}`;

    const queryParams = {
      categoryId,
      subjectId,
      detailId,
    };
    
    console.log('📡 Inviando richiesta a URL:', url);
    console.log('📡 Query params inviati:', queryParams);

    const response = await axios.post(
      url,
      formData,
      {
        params: queryParams,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ Risposta ricevuta dal backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Errore durante il caricamento del file:', error);
    if (error.response) {
      console.error('❌ Dettagli errore response:', error.response.data);
    }
    throw error;
  }
}

// Funzione per eliminare un file
export async function deleteFile(db, filePath) {
  try {
    const response = await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/api/file-manager/${db}`,
      {
        params: {
          filePath,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Errore durante l\'eliminazione del file:', error);
    throw error;
  }
}

// Funzione per cercare le transazioni
export async function searchTransactions(db, query = '') {
  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}/api/prima-nota/list`,
      {
        params: {
          db,
          search: query,
        },
      }
    );

    return response.data?.data || [];
  } catch (error) {
    console.error('Errore durante la ricerca delle transazioni:', error);
    return [];
  }
}

// Funzione per associare un file a una transazione
export async function linkFileToTransaction(db, fileUrl, transactionId) {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/file-manager/link-transaction`,
      {
        fileUrl,
        transactionId,
        db,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Errore durante l\'associazione del file alla transazione:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function useGetPrimaNotaDetail(id) {
  const URL = id ? [endpoints.prima_nota.details, { params: { id } }] : '';

  const { data, isLoading, error, isValidating } = useSWR(URL, fetcher);

  return useMemo(
    () => ({
      transaction: data?.data,
      transactionLoading: isLoading,
      transactionError: error,
      transactionValidating: isValidating,
    }),
    [data?.data, error, isLoading, isValidating]
  );
}

// ----------------------------------------------------------------------
