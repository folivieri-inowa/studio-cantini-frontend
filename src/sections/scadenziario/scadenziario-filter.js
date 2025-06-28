/**
 * Funzione di filtro migliorata per lo scadenziario
 * Gestisce in modo sicuro i dati, prevenendo errori con valori null o undefined
 */
export function applyFilter({ inputData, comparator, filters }) {
  const { searchQuery, startDate, endDate, status } = filters;
  
  // Verifica che inputData sia un array valido
  if (!Array.isArray(inputData)) {
    console.error('inputData non è un array valido:', inputData);
    return [];
  }
  
  // Filtra eventuali elementi null o undefined dall'array di input
  const validInputData = inputData.filter(item => item != null);
  
  // Debug: confronta il numero di elementi prima e dopo il filtraggio
  if (validInputData.length < inputData.length) {
    console.warn(`Rimossi ${inputData.length - validInputData.length} elementi nulli dalla lista`);
  }
  
  // Applica il sorteggio solo su dati validi
  const stabilizedThis = validInputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    try {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    } catch (error) {
      console.error('Errore durante il sorting:', error);
      return 0;
    }
  });

  let result = stabilizedThis.map((el) => el[0]);

  if (searchQuery) {
    const searchTermLower = searchQuery.toLowerCase();
    result = result.filter(
      (item) => {
        try {
          // Cerca in soggetto, descrizione, causale e importo
          const matchesSubject = item.subject ? 
            String(item.subject).toLowerCase().indexOf(searchTermLower) !== -1 : false;
          
          const matchesDescription = item.description ? 
            String(item.description).toLowerCase().indexOf(searchTermLower) !== -1 : false;
          
          const matchesCausale = item.causale ? 
            String(item.causale).toLowerCase().indexOf(searchTermLower) !== -1 : false;
          
          const matchesAmount = item.amount !== undefined && item.amount !== null ? 
            String(item.amount).indexOf(searchTermLower) !== -1 : false;
          
          return matchesSubject || matchesDescription || matchesCausale || matchesAmount;
        } catch (error) {
          console.error('Errore durante il filtro della ricerca:', error);
          return false;
        }
      }
    );
  }

  if (startDate && endDate) {
    result = result.filter(
      (item) => {
        try {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          return !isNaN(itemDate) && 
                 itemDate >= new Date(startDate) && 
                 itemDate <= new Date(endDate);
        } catch (error) {
          console.error('Errore durante il filtro per data:', error);
          return false;
        }
      }
    );
  }

  if (status && status.length) {
    result = result.filter((item) => {
      try {
        return item.status && status.includes(item.status);
      } catch (error) {
        console.error('Errore durante il filtro per stato:', error);
        return false;
      }
    });
  }

  return result;
}
