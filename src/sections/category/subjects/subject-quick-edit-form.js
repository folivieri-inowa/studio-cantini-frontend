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

export default function SubjectQuickEditForm({ currentSubject, open, onClose, onUpdate }) {
  const SubjectSchema = Yup.object().shape({
    name: Yup.string().required('Nome categoria è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentSubject?.id || null,
      name: currentSubject?.name || ''
    }),
    [currentSubject]
  );

  const methods = useForm({
    resolver: yupResolver(SubjectSchema),
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
      onClose();
      reset()
      onUpdate(data)
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

SubjectQuickEditForm.propTypes = {
  currentSubject: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
