import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrencyEur } from '../../utils/format-number';

// ----------------------------------------------------------------------

export default function PrimaNotaTotalModal({ open, onClose, transactions }) {
  // Calcola il totale delle transazioni selezionate
  const calculateTotal = () => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  };

  // Separa le transazioni in entrate e uscite
  const getTransactionsByType = () => {
    if (!transactions || transactions.length === 0) {
      return { entrate: [], uscite: [], totaleEntrate: 0, totaleUscite: 0 };
    }

    const entrate = transactions.filter(t => t.amount > 0);
    const uscite = transactions.filter(t => t.amount < 0);
    
    const totaleEntrate = entrate.reduce((sum, t) => sum + t.amount, 0);
    const totaleUscite = uscite.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { entrate, uscite, totaleEntrate, totaleUscite };
  };

  const { entrate, uscite, totaleEntrate, totaleUscite } = getTransactionsByType();
  const totaleNetto = totaleEntrate - totaleUscite;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">Calcolo Totale Voci Selezionate</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Riepilogo generale */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Riepilogo Generale
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Numero voci selezionate:</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {transactions?.length || 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Totale generale:</Typography>
                <Typography 
                  variant="h6" 
                  color={totaleNetto >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {fCurrencyEur(calculateTotal())}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Dettaglio entrate e uscite */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Dettaglio per Tipo
            </Typography>
            <Stack spacing={2}>
              {/* Entrate */}
              <Stack 
                direction="row" 
                justifyContent="space-between"
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  backgroundColor: 'success.lighter',
                  border: '1px solid',
                  borderColor: 'success.light'
                }}
              >
                <Stack>
                  <Typography variant="body2" color="success.darker" fontWeight="medium">
                    Entrate
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    {entrate.length} voci
                  </Typography>
                </Stack>
                <Typography variant="h6" color="success.main" fontWeight="bold">
                  +{fCurrencyEur(totaleEntrate)}
                </Typography>
              </Stack>

              {/* Uscite */}
              <Stack 
                direction="row" 
                justifyContent="space-between"
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  backgroundColor: 'error.lighter',
                  border: '1px solid',
                  borderColor: 'error.light'
                }}
              >
                <Stack>
                  <Typography variant="body2" color="error.darker" fontWeight="medium">
                    Uscite
                  </Typography>
                  <Typography variant="caption" color="error.dark">
                    {uscite.length} voci
                  </Typography>
                </Stack>
                <Typography variant="h6" color="error.main" fontWeight="bold">
                  -{fCurrencyEur(totaleUscite)}
                </Typography>
              </Stack>

              {/* Totale netto */}
              <Stack 
                direction="row" 
                justifyContent="space-between"
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  backgroundColor: 'grey.100',
                  border: '2px solid',
                  borderColor: totaleNetto >= 0 ? 'success.main' : 'error.main'
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  Totale Netto
                </Typography>
                <Typography 
                  variant="h5" 
                  color={totaleNetto >= 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {fCurrencyEur(totaleNetto)}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PrimaNotaTotalModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  transactions: PropTypes.array,
};
