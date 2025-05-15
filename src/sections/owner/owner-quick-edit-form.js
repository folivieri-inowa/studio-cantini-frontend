import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useSnackbar } from 'src/components/snackbar';
import { useBoolean } from 'src/hooks/use-boolean';
import FormProvider, { RHFTextField, RHFSwitch } from 'src/components/hook-form';

import axios from '../../utils/axios';

// ----------------------------------------------------------------------

export default function OwnerQuickEditForm({ currentOwner, open, onClose, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const loading = useBoolean();

  const NewOwnerSchema = Yup.object().shape({
    name: Yup.string().required('Il nome è richiesto'),
    cc: Yup.string().required('Il numero di conto corrente è richiesto'),
    iban: Yup.string(),
    initialBalance: Yup.number().required('Il saldo iniziale è richiesto'),
    balanceDate: Yup.date().nullable(),
    isCreditCard: Yup.boolean().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentOwner?.name || '',
      cc: currentOwner?.cc || '',
      iban: currentOwner?.iban || '',
      initialBalance: currentOwner?.initialBalance || 0,
      balanceDate: currentOwner?.balanceDate
        ? (() => {
            // Correzione per compensare il problema del fuso orario
            const date = new Date(currentOwner.balanceDate);
            // Imposta l'ora a mezzogiorno per evitare problemi di fuso orario
            date.setHours(12, 0, 0, 0);
            return date;
          })()
        : null,
      isCreditCard: currentOwner?.isCreditCard || false,
    }),
    [currentOwner]
  );

  const methods = useForm({
    resolver: yupResolver(NewOwnerSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentOwner) {
      reset(defaultValues);
    }
  }, [currentOwner, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      loading.onTrue();
      
      // Normalizza la data impostando l'ora a mezzogiorno per evitare problemi di fuso orario
      let balanceDate = null;
      if (data.balanceDate) {
        const date = new Date(data.balanceDate);
        date.setHours(12, 0, 0, 0);
        balanceDate = date;
      }

      await axios.post('/api/owner/edit', {
        id: currentOwner.id,
        name: data.name,
        cc: data.cc,
        iban: data.iban,
        initialBalance: data.initialBalance,
        balanceDate: balanceDate,
        isCreditCard: data.isCreditCard,
      });

      onUpdate({
        ...currentOwner,
        name: data.name,
        cc: data.cc,
        iban: data.iban,
        initialBalance: data.initialBalance,
        balanceDate: balanceDate,
        isCreditCard: data.isCreditCard,
      });

      enqueueSnackbar('Aggiornamento avvenuto con successo!');
      onClose();
    } catch (error) {
      enqueueSnackbar('Errore, riprova più tardi', { variant: 'error' });
    } finally {
      loading.onFalse();
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 460 },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Modifica Rapida</DialogTitle>

        <DialogContent>
          <Stack spacing={3} direction={{ xs: 'column', sm: 'column' }} sx={{ py: 2.5 }}>
            <RHFTextField name="name" label="Nome Titolare Conto" />
            <RHFTextField name="cc" label="Numero Conto Corrente" />
            <RHFTextField name="iban" label="IBAN" />
            
            <Stack direction="row" spacing={2}>
              <RHFTextField name="initialBalance" label="Saldo Iniziale" type="number" />
              
              <Controller
                name="balanceDate"
                control={methods.control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Data Saldo"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(newValue) => {
                      field.onChange(newValue);
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
            </Stack>
            
            <RHFSwitch
              name="isCreditCard"
              label="Carta di Credito"
              labelPlacement="start"
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Annulla
          </Button>

          <LoadingButton
            type="submit"
            variant="contained"
            loading={loading.value && isSubmitting}
          >
            Aggiorna
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

OwnerQuickEditForm.propTypes = {
  currentOwner: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
