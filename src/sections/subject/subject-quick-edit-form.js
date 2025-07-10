import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DeleteIcon from '@mui/icons-material/Delete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import axios from '../../utils/axios';

// ----------------------------------------------------------------------

export default function SubjectQuickEditForm({ currentSubject, open, onClose, onEditRow }) {
  const [checked, setChecked] = useState(false);

  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Nome è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      _id: currentSubject?._id || '',
      name: currentSubject?.name || '',
      metadata: currentSubject?.metadata || [],
    }),
    [currentSubject]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    register,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const metadata = watch("metadata", currentSubject?.metadata || []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!checked) data.metadata = []

      const response = await axios.post('/api/subject/edit', data);

      if (response.status === 200) {

        enqueueSnackbar('Soggetto aggiornato correttamente', { variant: 'success' });
        onEditRow();
        reset();
        onClose();
      }else{
        enqueueSnackbar('Si è verifica un errore durante l\'aggiornamento', { variant: 'error' });
      }

    } catch (error) {
      console.error(error);
    }
  });

  useEffect(() => {
    reset(defaultValues);
    setChecked(currentSubject?.metadata?.length > 0);
  }, [currentSubject, defaultValues, reset]);

  const handleRemoveMetadata = (index) => {
    const newMetadata = metadata.filter((_, i) => i !== index);
    setValue("metadata", newMetadata, { shouldValidate: true, shouldDirty: true });
  };

  const handleAddMetadata = () => {
    const newMetadata = [...metadata, { key: "", value: "" }];
    setValue("metadata", newMetadata, { shouldValidate: true, shouldDirty: true });
  };

  const handleChange = (event) => {
    if (event.target.checked) {
      setChecked(event.target.checked);
      if (metadata.length === 0) handleAddMetadata();
    } else {
      setChecked(event.target.checked);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={open}
      onClose={onClose}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Update</DialogTitle>

        <DialogContent>
          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
            <RHFTextField
              name="name"
              label="Nome completo"
            />

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={2} alignItems="center" flexGrow={1}>
                <Typography>Altri dati da memorizzare?</Typography>
                <Switch
                  checked={checked}
                  onChange={handleChange}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </Stack>
              {checked && (
                <Button variant="contained" onClick={handleAddMetadata} size="small">
                  <AddIcon /> Aggiungi
                </Button>
              )}
            </Stack>

            {checked &&
              metadata.map((_, index) => (
                <Stack key={index} direction="row" spacing={2} alignItems="center">
                  <TextField
                    {...register(`metadata.${index}.key`)} // Associa i campi al form
                    label={`Chiave ${index + 1}`}
                    fullWidth
                  />
                  <TextField
                    {...register(`metadata.${index}.value`)}
                    label={`Valore ${index + 1}`}
                    fullWidth
                  />
                  <IconButton color="error" onClick={() => handleRemoveMetadata(index)} aria-label="Rimuovi campo">
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
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

SubjectQuickEditForm.propTypes = {
  currentSubject: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onEditRow: PropTypes.func,
};
