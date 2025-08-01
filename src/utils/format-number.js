import numeral from 'numeral';

// ----------------------------------------------------------------------

export function fNumber(number) {
  if (number === null || number === undefined || Number.isNaN(Number(number))) {
    return '0';
  }
  return numeral(Number(number)).format();
}

export function fCurrencyEur(number) {
  // Gestione sicura per valori null, undefined, NaN o stringa vuota
  if (number === null || number === undefined || Number.isNaN(Number(number)) || number === '') {
    return '€0,00';
  }
  
  // Usa direttamente Intl.NumberFormat per una formattazione corretta italiana
  const euroFormatted = new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(number));

  return euroFormatted;
}

export function fCurrency(number) {
  const format = number ? numeral(number).format('$0,0.00') : '';

  return result(format, '.00');
}

export function fPercent(number) {
  if (number === null || number === undefined || Number.isNaN(Number(number))) {
    return '0.0%';
  }
  const format = numeral(Number(number) / 100).format('0.0%');

  return result(format, '.0');
}

export function fShortenNumber(number) {
  const format = number ? numeral(number).format('0.00a') : '';

  return result(format, '.00');
}

export function fData(number) {
  const format = number ? numeral(number).format('0.0 b') : '';

  return result(format, '.0');
}

function result(format, key = '.00') {
  const isInteger = format.includes(key);

  return isInteger ? format.replace(key, '') : format;
}
