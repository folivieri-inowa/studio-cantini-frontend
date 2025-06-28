'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useGetScadenziarioItem } from 'src/api/scadenziario-services';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

import { formatCurrency } from './scadenziario-utils';

// ----------------------------------------------------------------------

export default function ScadenziarioDetailsModal({ id, open, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  
  const [itemStatus, setItemStatus] = useState('');
  const { scadenziarioItem, scadenziarioItemLoading } = useGetScadenziarioItem(id);

  useEffect(() => {
    if (scadenziarioItem) {
      setItemStatus(scadenziarioItem.status);
    }
  }, [scadenziarioItem]);

  // Funzione per ottenere il colore e label in base allo stato
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'success', label: 'Pagato' };
      case 'overdue':
        return { color: 'error', label: 'Scaduto' };
      case 'upcoming':
        return { color: 'warning', label: 'In scadenza' };
      case 'future':
        return { color: 'info', label: 'Da pagare' };
      default:
        return { color: 'default', label: status };
    }
  };

  return (
    <Dialog 
      fullScreen={fullScreen}
      fullWidth 
      maxWidth="md" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: { 
          borderRadius: 2, 
          maxHeight: 'calc(100% - 64px)',
          boxShadow: 'customShadows.z24'
        }
      }}
    >
      <DialogTitle sx={{ py: 2.5, px: 3, bgcolor: 'background.neutral' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify icon="solar:document-bold" sx={{ mr: 1.5, width: 28, height: 28, color: 'primary.main' }} />
            Dettagli Scadenza
          </Typography>
          
          <IconButton size="small" onClick={onClose} aria-label="chiudi">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {scadenziarioItemLoading ? (
          <Box sx={{ py: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : !scadenziarioItem ? (
          <Typography>Nessun dato disponibile</Typography>
        ) : (
          <Box sx={{ width: '100%' }}>
            {/* Header con titolo e stato */}
            <Box 
              sx={{ 
                mb: 3, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' }
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'text.primary', 
                  mb: { xs: 1, sm: 0 } 
                }}
              >
                {scadenziarioItem.subject}
              </Typography>
              
              {itemStatus && (
                <Label
                  variant="filled"
                  color={getStatusInfo(itemStatus).color}
                  sx={{
                    textTransform: 'uppercase',
                    fontSize: '0.85rem',
                    py: 1,
                    px: 2,
                    borderRadius: 1
                  }}
                >
                  {getStatusInfo(itemStatus).label}
                </Label>
              )}
            </Box>
            
            <Divider sx={{ borderStyle: 'dashed', my: 2.5 }} />
            
            {/* Dettagli principali */}
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Descrizione
                  </Typography>
                  <Typography variant="body1">
                    {scadenziarioItem.description}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Causale
                  </Typography>
                  <Typography variant="body1">
                    {scadenziarioItem.causale}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, mb: 3, px: 0.5 }}>
              <Divider sx={{ borderStyle: 'dashed', my: 2.5 }} />
            </Box>
            
            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Data di scadenza
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'medium',
                      color: itemStatus === 'overdue' ? 'error.main' : 'text.primary'
                    }}
                  >
                    {scadenziarioItem.date 
                      ? format(new Date(scadenziarioItem.date), 'd MMMM yyyy', { locale: it }) 
                      : 'Non specificata'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Importo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {formatCurrency(scadenziarioItem.amount)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, px: 0.5 }}>
              <Divider sx={{ borderStyle: 'dashed', my: 2.5 }} />
              <Box sx={{ mt: 2 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: scadenziarioItem.paymentDate ? 'success.main' : 'text.secondary',
                    fontWeight: scadenziarioItem.paymentDate ? 'medium' : 'regular'
                  }}
                >
                  {scadenziarioItem.paymentDate 
                    ? `Pagato il ${format(new Date(scadenziarioItem.paymentDate), 'd MMMM yyyy', { locale: it })}` 
                    : 'Non ancora pagato'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, bgcolor: 'background.neutral' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={onClose}
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{ px: 3, boxShadow: 'customShadows.primary' }}
        >
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}
