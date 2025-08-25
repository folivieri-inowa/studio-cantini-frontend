import PropTypes from 'prop-types';

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/InfoOutlined';

// ----------------------------------------------------------------------

/**
 * Componente tooltip per spiegare i calcoli delle spese mensili
 * @param {object} calculationResult - Risultato del calcolo smart con explanation e reliability
 * @param {string} title - Titolo alternativo per il tooltip 
 * @param {object} sx - Stili personalizzati
 */
export default function ExpenseCalculationTooltip({ 
  calculationResult, 
  title, 
  sx,
  ...other 
}) {
  // Genera il contenuto del tooltip basato sul risultato del calcolo
  const getTooltipContent = () => {
    if (!calculationResult) {
      return title || 'Calcolo della media mensile delle spese';
    }

    const { method, explanation, reliability, isOccasional, pattern } = calculationResult;

    let methodDescription = '';
    let adviceText = '';

    switch (method) {
      case 'OCCASIONAL-BUDGET':
        methodDescription = '💡 Spese Occasionali - Approccio Budgeting';
        adviceText = 'Questa categoria presenta spese sporadiche. L\'importo indicato rappresenta quanto accantonare ogni mese per coprire la spesa annuale totale.';
        break;
      
      case 'SEASONAL':
        methodDescription = '🗓️ Spese Stagionali - Periodo Specifico';  
        adviceText = 'Spese concentrate in determinati mesi dell\'anno. La media è calcolata sul periodo effettivamente attivo.';
        break;
      
      case 'FULL-YEAR':
        methodDescription = '📅 Spese Regolari - Distribuzione Annuale';
        adviceText = 'Spese distribuite costantemente durante l\'anno. La previsione mensile è molto affidabile.';
        break;
      
      default:
        methodDescription = '📊 Calcolo Media Spese';
        adviceText = 'Media mensile delle spese calcolata sui dati disponibili.';
    }

    return `${methodDescription}

📝 ${explanation}

📊 Pattern rilevato: ${pattern}
🎯 Affidabilità: ${reliability}

💡 Consiglio:
${adviceText}

${isOccasional ? 
  '⚠️ NOTA: Per spese occasionali, questo valore rappresenta quanto accantonare mensilmente, NON la spesa effettiva mensile.' : 
  '✅ Questa previsione mensile è calcolata in base al pattern di spesa rilevato.'
}`;
  };

  return (
    <Tooltip
      title={getTooltipContent()}
      arrow
      placement="top"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'grey.900',
            color: 'common.white',
            maxWidth: 400,
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: 'pre-line', // Preserve line breaks
            p: 2,
            '& .MuiTooltip-arrow': {
              color: 'grey.900',
            },
          },
        },
      }}
      {...other}
    >
      <IconButton 
        size="small" 
        sx={{ 
          ml: 0.5, 
          color: calculationResult?.isOccasional ? 'warning.main' : 'text.secondary',
          '&:hover': {
            color: calculationResult?.isOccasional ? 'warning.dark' : 'primary.main',
          },
          ...sx 
        }}
      >
        <InfoIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

ExpenseCalculationTooltip.propTypes = {
  calculationResult: PropTypes.shape({
    average: PropTypes.number,
    method: PropTypes.string,
    explanation: PropTypes.string,
    reliability: PropTypes.string,
    isOccasional: PropTypes.bool,
    pattern: PropTypes.string,
  }),
  title: PropTypes.string,
  sx: PropTypes.object,
};
