import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useRouter } from 'src/routes/hooks';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField, RHFSwitch } from 'src/components/hook-form';
import axios from '../../utils/axios';
import { paths as endpoint } from '../../routes/paths';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function OwnerNewEditForm({ ownerData }) {
  const router = useRouter();
  const { db } = useSettingsContext()
  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required('Nome Titolare conto è un campo obbligatorio'),
    balanceDate: Yup.date().nullable(),
    isCreditCard: Yup.boolean().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      id: ownerData?.id || null,
      name: ownerData?.name || '',
      cc: ownerData?.cc || '',
      iban: ownerData?.iban || '',
      initialBalance: ownerData?.initialBalance || '',
      balanceDate: ownerData?.balanceDate || null,
      isCreditCard: ownerData?.isCreditCard || false,
    }),
    [ownerData]
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

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();

      // Normalizza la data impostando l'ora a mezzogiorno per evitare problemi di fuso orario
      let balanceDate = null;
      if (data.balanceDate) {
        const date = new Date(data.balanceDate);
        date.setHours(12, 0, 0, 0);
        balanceDate = date;
      }

      const response = await axios.post('/api/owner/create', {
        ...data, 
        db,
        balanceDate
      });

      if (response.status === 200) {
        router.push(endpoint.dashboard.owner.root);
        enqueueSnackbar(ownerData ? 'Update success!' : 'Create success!');
      }else{
        enqueueSnackbar('Si è verificato un errore');
      }
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Card sx={{ p: 3 }}>
            <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
                <RHFTextField name="id" sx={{ display: "none"}} />
                <RHFTextField name="name" label="Nome Titolare conto" />
                <RHFTextField name="cc" label="Numero del conto" />
                <RHFTextField name="iban" label="IBAN" />
              </Stack>
              
              <Grid container spacing={2} alignItems="center">
                <Grid xs={4}>
                  <RHFTextField 
                    name="initialBalance" 
                    label="Saldo Iniziale" 
                    type="number"
                    fullWidth
                  />
                </Grid>
                
                <Grid xs={4}>
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
                </Grid>
                
                <Grid xs={4}>
                  <RHFSwitch
                    name="isCreditCard"
                    label="Carta di Credito"
                    labelPlacement="start"
                    sx={{ mx: 0, width: '100%', justifyContent: 'space-between' }}
                  />
                </Grid>
              </Grid>
            </Stack>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Salva
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

OwnerNewEditForm.propTypes = {
  ownerData: PropTypes.object,
};
