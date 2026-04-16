'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'src/routes/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import CardContent from '@mui/material/CardContent';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form/form-provider';
import RHFTextField from 'src/components/hook-form/rhf-text-field';
import RHFSelect from 'src/components/hook-form/rhf-select';
import { useSnackbar } from 'src/components/snackbar';

import { paths } from 'src/routes/paths';
import { createVehicle, createVehicleDocument, uploadVehicleDocument } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const STEPS = ['Dati veicolo', 'Titolarità e assegnazione', 'Documenti iniziali'];

const STATUS_OPTIONS = ['attivo', 'fermo', 'in_manutenzione'];
const FUEL_OPTIONS = ['benzina', 'diesel', 'ibrido', 'elettrico', 'gpl', 'metano', 'altro'];
const OWNER_TYPE_OPTIONS = ['azienda', 'privato', 'leasing', 'noleggio'];
const ASSIGNEE_TYPE_OPTIONS = ['dipendente', 'collaboratore', 'ufficio', 'altro'];
const AVAILABILITY_OPTIONS = ['aziendale', 'uso_misto', 'personale'];
const DOC_TYPE_OPTIONS = ['libretto', 'assicurazione', 'bollo', 'revisione', 'altro'];

// ----------------------------------------------------------------------

export default function VehicleCreateForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [pendingFiles, setPendingFiles] = useState([]);

  const methods = useForm({
    defaultValues: {
      plate: '',
      vin: '',
      make: '',
      model: '',
      registration_date: '',
      vehicle_usage: '',
      fuel_type: '',
      kw: '',
      engine_cc: '',
      seats: '',
      status: 'attivo',
      owner_type: '',
      owner_name: '',
      availability_type: '',
      assignee_type: '',
      assignee_name: '',
      assignment_notes: '',
      notes: '',
    },
  });

  const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

  const handleNext = useCallback(async () => {
    const fieldsPerStep = [
      ['plate'],
      [],
      [],
    ];
    const valid = await trigger(fieldsPerStep[activeStep]);
    if (valid) setActiveStep((s) => s + 1);
  }, [activeStep, trigger]);

  const handleBack = useCallback(() => {
    setActiveStep((s) => s - 1);
  }, []);

  const handleAddFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles((prev) => [...prev, { file, docType: 'altro', title: file.name }]);
    e.target.value = '';
  }, []);

  const handleRemoveFile = useCallback((idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleChangeDocType = useCallback((idx, value) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, docType: value } : f)));
  }, []);

  const handleChangeDocTitle = useCallback((idx, value) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, title: value } : f)));
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    try {
      // 1. Crea veicolo
      const res = await createVehicle(values);
      const vehicleId = res.data.id;

      // 2. Upload + crea record documenti
      for (const pending of pendingFiles) {
        try {
          const uploadRes = await uploadVehicleDocument(vehicleId, pending.docType, pending.file);
          await createVehicleDocument({
            vehicle_id: vehicleId,
            document_type: pending.docType,
            title: pending.title,
            file_path: uploadRes.data.file_path,
          });
        } catch (docErr) {
          console.error('Errore upload documento:', docErr);
        }
      }

      enqueueSnackbar('Veicolo creato con successo');
      router.push(paths.dashboard.vehicles.details(vehicleId));
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Errore creazione veicolo', { variant: 'error' });
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card>
        <CardContent>
          {/* ── Step 1: Dati veicolo ── */}
          {activeStep === 0 && (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Typography variant="h6" gutterBottom>Dati veicolo</Typography>
              </Grid>

              <Grid xs={12} md={4}>
                <RHFTextField
                  name="plate"
                  label="Targa *"
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFTextField name="make" label="Marca" />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFTextField name="model" label="Modello" />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFTextField name="vin" label="Telaio (VIN)" />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFTextField name="registration_date" label="Data immatricolazione" type="date" InputLabelProps={{ shrink: true }} />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFSelect name="fuel_type" label="Alimentazione">
                  <MenuItem value="">—</MenuItem>
                  {FUEL_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </RHFSelect>
              </Grid>

              <Grid xs={12} md={3}>
                <RHFTextField name="kw" label="Potenza (kW)" type="number" />
              </Grid>

              <Grid xs={12} md={3}>
                <RHFTextField name="engine_cc" label="Cilindrata (cc)" type="number" />
              </Grid>

              <Grid xs={12} md={3}>
                <RHFTextField name="seats" label="Posti" type="number" />
              </Grid>

              <Grid xs={12} md={3}>
                <RHFSelect name="status" label="Stato">
                  {STATUS_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </RHFSelect>
              </Grid>

              <Grid xs={12}>
                <RHFTextField name="vehicle_usage" label="Uso veicolo" />
              </Grid>

              <Grid xs={12}>
                <RHFTextField name="notes" label="Note" multiline rows={3} />
              </Grid>
            </Grid>
          )}

          {/* ── Step 2: Titolarità / Disponibilità / Assegnazione ── */}
          {activeStep === 1 && (
            <Grid container spacing={3}>
              <Grid xs={12}>
                <Typography variant="h6" gutterBottom>Titolarità e disponibilità</Typography>
              </Grid>

              <Grid xs={12} md={4}>
                <RHFSelect name="owner_type" label="Tipo intestatario">
                  <MenuItem value="">—</MenuItem>
                  {OWNER_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </RHFSelect>
              </Grid>

              <Grid xs={12} md={8}>
                <RHFTextField name="owner_name" label="Intestatario" />
              </Grid>

              <Grid xs={12} md={4}>
                <RHFSelect name="availability_type" label="Disponibilità">
                  <MenuItem value="">—</MenuItem>
                  {AVAILABILITY_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </RHFSelect>
              </Grid>

              <Grid xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>Assegnazione</Typography>
              </Grid>

              <Grid xs={12} md={4}>
                <RHFSelect name="assignee_type" label="Tipo assegnatario">
                  <MenuItem value="">—</MenuItem>
                  {ASSIGNEE_TYPE_OPTIONS.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </RHFSelect>
              </Grid>

              <Grid xs={12} md={8}>
                <RHFTextField name="assignee_name" label="Assegnatario" />
              </Grid>

              <Grid xs={12}>
                <RHFTextField name="assignment_notes" label="Note assegnazione" multiline rows={2} />
              </Grid>
            </Grid>
          )}

          {/* ── Step 3: Documenti iniziali ── */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Documenti iniziali (opzionale)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puoi caricare documenti subito o aggiungerli in seguito dalla scheda veicolo.
              </Typography>

              <Button
                component="label"
                variant="outlined"
                startIcon={<Iconify icon="eva:attach-fill" />}
                sx={{ mb: 2 }}
              >
                Aggiungi documento
                <input type="file" hidden onChange={handleAddFile} accept=".pdf,.png,.jpg,.jpeg" />
              </Button>

              {pendingFiles.length > 0 && (
                <List disablePadding>
                  {pendingFiles.map((item, idx) => (
                    <ListItem
                      key={idx}
                      disableGutters
                      sx={{ gap: 1, flexWrap: 'wrap', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                      secondaryAction={
                        <IconButton size="small" color="error" onClick={() => handleRemoveFile(idx)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      }
                    >
                      <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap', pr: 5 }}>
                        <Box sx={{ minWidth: 160 }}>
                          <Typography variant="caption" color="text.secondary">Tipo</Typography>
                          <select
                            value={item.docType}
                            onChange={(e) => handleChangeDocType(idx, e.target.value)}
                            style={{ display: 'block', width: '100%', marginTop: 2 }}
                          >
                            {DOC_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 200 }}>
                          <Typography variant="caption" color="text.secondary">Titolo</Typography>
                          <input
                            value={item.title}
                            onChange={(e) => handleChangeDocTitle(idx, e.target.value)}
                            style={{ display: 'block', width: '100%', marginTop: 2 }}
                          />
                        </Box>
                        <ListItemText
                          primary={item.file.name}
                          secondary={`${(item.file.size / 1024).toFixed(0)} KB`}
                          sx={{ flex: 'none', alignSelf: 'center' }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Navigazione wizard ── */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          onClick={activeStep === 0 ? () => router.back() : handleBack}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        >
          {activeStep === 0 ? 'Annulla' : 'Indietro'}
        </Button>

        {activeStep < STEPS.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Avanti
          </Button>
        ) : (
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            endIcon={<Iconify icon="eva:checkmark-fill" />}
          >
            {isSubmitting ? 'Salvataggio...' : 'Crea Veicolo'}
          </Button>
        )}
      </Stack>
    </FormProvider>
  );
}
