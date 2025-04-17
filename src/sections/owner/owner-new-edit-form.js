import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import LoadingButton from '@mui/lab/LoadingButton';

import { useRouter } from 'src/routes/hooks';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';
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
  });

  const defaultValues = useMemo(
    () => ({
      id: ownerData?.id || null,
      name: ownerData?.name || '',
      cc: ownerData?.cc || '',
      iban: ownerData?.iban || '',
      initialBalance: ownerData?.initialBalance || '',
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

      const response = await axios.post('/api/owner/create', {...data, db});

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
              <RHFTextField name="initialBalance" label="Saldo Iniziale" type="number" />
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
