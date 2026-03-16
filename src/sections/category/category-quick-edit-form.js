import * as Yup from 'yup';
import { useMemo, useEffect } from 'react';
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

export default function CategoryQuickEditForm({ currentCategory, currentDb, open, onClose, onUpdate }) {
  const CategorySchema = Yup.object().shape({
    name: Yup.string().required('Nome categoria è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentCategory?.id || currentCategory?._id || null,
      name: currentCategory?.name || '',
      db: currentDb || currentCategory?.db || '',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentCategory?.id, currentCategory?._id, currentCategory?.name, currentDb]
  );

  const methods = useForm({
    resolver: yupResolver(CategorySchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (onUpdate) {
        await onUpdate(data);
      }
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
              InputProps={{ readOnly: true }}
              sx={{ display: 'none' }}
            />
            <RHFTextField
              name="db"
              label="DB"
              InputProps={{ readOnly: true }}
              sx={{ display: 'none' }}
            />
            <RHFTextField
              name="name"
              label="Nome"
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
  currentDb: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
