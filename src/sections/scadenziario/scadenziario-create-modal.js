'use client';

import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFTextField,
  RHFSelect,
} from 'src/components/hook-form';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ScadenziarioCreateModal({ open, onClose, onCreated }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const NewScadenziarioSchema = Yup.object().shape({
    subject: Yup.string().required('Soggetto richiesto'),
    description: Yup.string().required('Descrizione richiesta'),
    causale: Yup.string().required('Causale richiesta'),
    date: Yup.date().required('Data scadenza richiesta'),
    amount: Yup.number().moreThan(0, 'Il valore deve essere maggiore di 0').required('Importo richiesto'),
    paymentDate: Yup.date().nullable(),
    status: Yup.string().required('Stato richiesto'),
  });

  // Funzione per calcolare lo stato predefinito in base alla data di scadenza
  const calculateDefaultStatus = (dueDate) => {
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'overdue'; // Scaduto
    } else if (diffDays <= 15) {
      return 'upcoming'; // In scadenza
    } else {
      return 'future'; // Da pagare (futuro)
    }
  };

  const defaultValues = useMemo(
    () => ({
      subject: '',
      description: '',
      causale: '',
      date: new Date(),
      amount: 0,
      paymentDate: null,
      status: calculateDefaultStatus(new Date()),
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewScadenziarioSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Salvataggio dei dati tramite API
      const { createScadenziario } = await import('../../api/scadenziario-services');
      await createScadenziario(data);
      
      reset();
      enqueueSnackbar('Scadenza creata con successo!');
      onCreated && onCreated();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Si è verificato un errore durante il salvataggio!', { variant: 'error' });
    }
  });

  return (
    <Dialog 
      fullScreen={fullScreen}
      fullWidth 
      maxWidth="md" 
      open={open} 
      onClose={handleClose}
      PaperProps={{
        sx: { borderRadius: 2, maxHeight: 'calc(100% - 64px)' }
      }}
    >
      <DialogTitle sx={{ p: 3 }}>
        <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <Iconify icon="solar:add-circle-bold" sx={{ mr: 1, width: 24, height: 24, color: 'primary.main' }} />
          Nuovo scadenziario
        </Typography>
      </DialogTitle>
      
      <Divider sx={{ borderStyle: 'dashed' }} />
      
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <RHFTextField name="subject" label="Soggetto" />
            <RHFTextField name="description" label="Descrizione" />
            
            <RHFTextField name="causale" label="Causale" />
            
            <Controller
              name="date"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Data scadenza"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    if (newValue) {
                      // Aggiorna lo stato in base alla nuova data
                      const newStatus = calculateDefaultStatus(newValue);
                      setValue('status', newStatus);
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                />
              )}
            />
            
            <RHFTextField name="amount" label="Importo" type="number" />
            
            <Controller
              name="paymentDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <DatePicker
                  label="Data pagamento"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(newValue) => {
                    field.onChange(newValue);
                    // Se viene inserita una data di pagamento, imposta lo stato su 'completed'
                    if (newValue) {
                      setValue('status', 'completed');
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!error,
                      helperText: error?.message,
                    },
                  }}
                />
              )}
            />
            
            <RHFSelect name="status" label="Stato pagamento">
              <option value="completed">Pagato</option>
              <option value="overdue">Scaduto</option>
              <option value="upcoming">In scadenza</option>
              <option value="future">Da pagare</option>
            </RHFSelect>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={handleClose}
            startIcon={<Iconify icon="eva:close-fill" />}
          >
            Annulla
          </Button>
          
          <LoadingButton 
            type="submit" 
            variant="contained" 
            loading={isSubmitting}
            startIcon={<Iconify icon="eva:checkmark-fill" />}
          >
            Salva
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
