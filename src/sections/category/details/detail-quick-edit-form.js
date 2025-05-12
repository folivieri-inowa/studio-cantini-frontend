import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function DetailQuickEditForm({ currentDetail, open, onClose, onUpdate }) {
  const DetailSchema = Yup.object().shape({
    name: Yup.string().required('Nome dettaglio è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentDetail?.id || null,
      name: currentDetail?.name || ''
    }),
    [currentDetail]
  );

  const methods = useForm({
    resolver: yupResolver(DetailSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Eseguiamo la funzione di aggiornamento passata dal componente padre
      // prima di chiudere il form, così possiamo essere sicuri che l'operazione
      // sia completata e la UI venga aggiornata
      if (onUpdate) {
        await onUpdate(data);
      }
      
      // Chiudiamo il dialog e resettiamo il form
      onClose();
      reset();
    } catch (error) {
      console.error(error);
    }
  });


  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={open}
      onClose={onClose}
    >
      <DialogTitle>Modifica rapida</DialogTitle>

      <DialogContent>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Stack spacing={3} sx={{ py: 3 }} direction="row">
            <RHFTextField
              name="id"
              label="Id"
              defaultValue={defaultValues.id}
              InputProps={{ readOnly: true, style: { color: 'gray' } }}
              sx={{
                display: 'none',
              }}
            />
            <RHFTextField
              name="name"
              label="Nome"
              onChange={(e) => {
                setValue("name", e.target.value);
              }}
            />
          </Stack>

          <Stack alignItems="flex-end" sx={{ my: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Salva
            </LoadingButton>
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

DetailQuickEditForm.propTypes = {
  currentDetail: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
