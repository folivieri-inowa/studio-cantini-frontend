// utils/payment-terms.js
import { addDays, endOfMonth } from 'date-fns';

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediato',  label: 'Immediato',         days: 0,  end_of_month: false },
  { value: '30gg',       label: '30 giorni',          days: 30, end_of_month: false },
  { value: '60gg',       label: '60 giorni',          days: 60, end_of_month: false },
  { value: '90gg',       label: '90 giorni',          days: 90, end_of_month: false },
  { value: '30ggfm',     label: '30 gg fine mese',    days: 30, end_of_month: true  },
  { value: '60ggfm',     label: '60 gg fine mese',    days: 60, end_of_month: true  },
  { value: 'data_fissa', label: 'Data fissa',         days: 0,  end_of_month: false },
];

export const FREQUENCY_OPTIONS = [
  { value: 'mensile',     label: 'Mensile',     months: 1  },
  { value: 'bimestrale',  label: 'Bimestrale',  months: 2  },
  { value: 'trimestrale', label: 'Trimestrale', months: 3  },
  { value: 'semestrale',  label: 'Semestrale',  months: 6  },
  { value: 'annuale',     label: 'Annuale',     months: 12 },
];

export const TYPE_OPTIONS = [
  { value: 'fattura',    label: 'Fattura',             icon: 'solar:document-bold'  },
  { value: 'acconto',    label: 'Acconto',             icon: 'solar:money-bag-bold'  },
  { value: 'saldo',      label: 'Saldo',               icon: 'solar:check-circle-bold' },
  { value: 'rata',       label: 'Piano rate',           icon: 'solar:calendar-bold'  },
  { value: 'fiscale',    label: 'Scadenza fiscale',     icon: 'solar:bill-bold'      },
  { value: 'ricorrente', label: 'Pagamento ricorrente', icon: 'solar:refresh-bold'   },
  { value: 'altro',      label: 'Altro',                icon: 'solar:widget-bold'    },
];

/**
 * Calcola la data di scadenza da data fattura + condizione di pagamento.
 * @param {Date|string} invoiceDate
 * @param {string} paymentTermsValue - valore da PAYMENT_TERMS_OPTIONS
 * @returns {Date|null}
 */
export function calculateDueDate(invoiceDate, paymentTermsValue) {
  if (!invoiceDate || !paymentTermsValue) return null;
  const terms = PAYMENT_TERMS_OPTIONS.find(t => t.value === paymentTermsValue);
  if (!terms || terms.value === 'data_fissa') return null;

  let result = addDays(new Date(invoiceDate), terms.days);
  if (terms.end_of_month) result = endOfMonth(result);
  return result;
}

/**
 * Genera le date delle rate di un piano.
 * @param {Object} params
 * @param {Date} params.startDate
 * @param {number} params.installments
 * @param {string} params.frequency
 * @param {number} params.amount - importo per rata
 * @param {string} params.groupName
 * @returns {Array<{subject, date, amount}>}
 */
export function generateInstallments({ startDate, installments, frequency, amount, groupName }) {
  const freq = FREQUENCY_OPTIONS.find(f => f.value === frequency);
  const step = freq?.months || 1;
  const result = [];

  for (let i = 0; i < installments; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i * step);
    result.push({
      subject: `${groupName} — Rata ${i + 1}/${installments}`,
      date: d,
      amount,
    });
  }

  return result;
}
