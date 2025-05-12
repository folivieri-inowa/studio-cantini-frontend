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

export default function CategoryQuickEditForm({ currentCategory, open, onClose, onUpdate }) {
  const CategorySchema = Yup.object().shape({
    name: Yup.string().required('Nome categoria è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentCategory?.id || currentCategory?._id || null, // Utilizziamo entrambi i campi id
      name: currentCategory?.name || '',
      db: currentCategory?.db || 'db1' // Assicuriamoci di avere il campo db
    }),
    [currentCategory]
  );

  const methods = useForm({
    resolver: yupResolver(CategorySchema),
    defaultValues,
  });

  const {
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Otteniamo i valori aggiornati direttamente dal form
      const currentFormValues = getValues();
      console.log('Valori correnti del form:', currentFormValues);
      
      // Debug logging
      console.log('Form data submitted RAW:', data);
      console.log('Current category:', currentCategory);
      
      // Assicuriamoci di avere un ID valido nel formato corretto e di includere il campo db
      const formattedData = {
        ...data,
        id: data.id || currentCategory?.id || currentCategory?._id, // Assicuriamoci di usare l'ID corretto
        db: data.db || currentCategory?.db || 'db1', // Assicuriamoci di includere il campo db
        name: currentFormValues.name || data.name, // Prendiamo il valore più aggiornato possibile
      };
      
      console.log('Formatted data for update:', formattedData);
      
      // Eseguiamo la funzione di aggiornamento passata dal componente padre
      // prima di chiudere il form, così possiamo essere sicuri che l'operazione
      // sia completata e la UI venga aggiornata
      if (onUpdate) {
        await onUpdate(formattedData);
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
              name="db"
              label="DB"
              defaultValue={defaultValues.db}
              InputProps={{ readOnly: true, style: { color: 'gray' } }}
              sx={{
                display: 'none',
              }}
            />
            <RHFTextField
              name="name"
              label="Nome"
              defaultValue={defaultValues.name}
              onChange={(e) => {
                const newValue = e.target.value;
                setValue("name", newValue);
                console.log('Nome campo aggiornato a:', newValue);
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

CategoryQuickEditForm.propTypes = {
  currentCategory: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
