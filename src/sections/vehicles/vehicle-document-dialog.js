'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';

import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import { RHFSelect } from 'src/components/hook-form';
import { useSnackbar } from 'src/components/snackbar';

import { uploadVehicleDocument, createVehicleDocument } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const DOC_TYPES = ['libretto', 'assicurazione', 'bollo', 'revisione', 'collaudo', 'altro'];

// ----------------------------------------------------------------------

export default function VehicleDocumentDialog({ open, onClose, vehicleId, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);

  const methods = useForm({
    defaultValues: {
      document_type: 'altro',
      title: '',
      document_date: '',
      expiry_date: '',
      notes: '',
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;

  const handleClose = useCallback(() => {
    reset();
    setFile(null);
    onClose();
  }, [reset, onClose]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      let filePath = '';
      if (file) {
        const uploadRes = await uploadVehicleDocument(vehicleId, values.document_type, file);
        filePath = uploadRes.data.file_path;
      }
      await createVehicleDocument({
        vehicle_id: vehicleId,
        document_type: values.document_type,
        title: values.title || file?.name || 'Documento',
        file_path: filePath,
        document_date: values.document_date || null,
        expiry_date: values.expiry_date || null,
        notes: values.notes || null,
      });
      enqueueSnackbar('Documento aggiunto');
      onSuccess?.();
      handleClose();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore', { variant: 'error' });
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Aggiungi documento</DialogTitle>

      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid xs={12} md={6}>
              <RHFSelect name="document_type" label="Tipo documento">
                {DOC_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </RHFSelect>
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="title" label="Titolo" />
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="document_date" label="Data documento" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid xs={12} md={6}>
              <RHFTextField name="expiry_date" label="Scadenza" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid xs={12}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Button component="label" variant="outlined" size="small">
                  {file ? file.name : 'Scegli file'}
                  <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </Button>
                {file && <Button size="small" color="error" onClick={() => setFile(null)}>Rimuovi</Button>}
              </Stack>
            </Grid>
            <Grid xs={12}>
              <RHFTextField name="notes" label="Note" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Salvataggio...' : 'Salva'}
          </Button>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}
