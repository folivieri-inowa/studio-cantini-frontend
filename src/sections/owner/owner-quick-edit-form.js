import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import axios from '../../utils/axios';

// ----------------------------------------------------------------------

export default function OwnerQuickEditForm({ currentOwner, open, onClose, onUpdate }) {
  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Nome titolare è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentOwner?.id || null,
      name: currentOwner?.name || '',
      cc: currentOwner?.cc || '',
      iban: currentOwner?.iban || '',
    }),
    [currentOwner]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset({
      id: currentOwner?.id || null,
      name: currentOwner?.name || '',
      cc: currentOwner?.cc || '',
      iban: currentOwner?.iban || '',
    })
  }, [currentOwner?.id, currentOwner?.cc, currentOwner?.iban, currentOwner?.name, reset])

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await axios.post('/api/owner/edit', data);

      if (response.status === 200) {
        onClose();
        reset();
        onUpdate(data);
        enqueueSnackbar('Aggiornamento completato!');
      }else{
        enqueueSnackbar('Si è verificato un errore');
      }
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { maxWidth: 720 },
        },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Modifica rapida</DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ py: 3 }}>
            <RHFTextField name="id" sx={{ display: "none"}} />
            <RHFTextField name="name" label="Nome Titolare Conto" />
            <RHFTextField name="cc" label="Numero Conto Corrente" />
            <RHFTextField name="iban" label="IBAN" />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Annulla
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
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
