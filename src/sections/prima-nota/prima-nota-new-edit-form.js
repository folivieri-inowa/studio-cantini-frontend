import * as Yup from 'yup';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import FormProvider from 'src/components/hook-form';

import PrimaNotaNewEditDetails from './prima-nota-new-edit-details';
import axios from '../../utils/axios';
import { paths } from '../../routes/paths';
import { useSnackbar } from '../../components/snackbar';
import { useSettingsContext } from '../../components/settings';
import { BACKEND_API } from '../../config-global';

// ----------------------------------------------------------------------

export default function PrimaNotaNewEditForm() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { db } = useSettingsContext();
  const loadingSend = useBoolean();

  const NewInvoiceSchema = Yup.object().shape({
    date: Yup.mixed().nullable().required('Data è un campo obbligatorio'),
    // amount: Yup.number().required('Importo è un campo obbligatorio'),
    description: Yup.string().required('Descrizione è un campo obbligatorio'),
    paymentType: Yup.string().required('Metodo di pagamento è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      owner: '',
      date: new Date(),
      amount: null,
      description: '',
      paymentType: '',
      note: '',
      category: '',
      subject: '',
      detail: '',
      documents: [],
      status: 'completed',
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleUploadFiles = async (images) => {
    const imageUrls = await Promise.all(
      images.map(async (image) => {
        if (image instanceof File) {
          const form = new FormData();
          form.append("file", image);
          const uploadedImage = await axios.post(`${BACKEND_API}/v1/upload`, form)
          return {url: uploadedImage.data.url, isNew: true};
        }
        return {url: image, isNew: false};
      })
    );
    return imageUrls;
  };

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const documentsUrl = await handleUploadFiles(data.documents);

      const dataToSend = {
        ...data,
        db,
        amount: parseFloat(data.positiveAmount || data.negativeAmount),
        documents: documentsUrl || [],
      }

      const response = await axios.post('/api/prima-nota/create',  dataToSend);
      if (response.status === 200) {
        reset();
        loadingSend.onFalse();
        router.push(paths.dashboard.prima_nota.root);
        enqueueSnackbar("Prima nota creata con successo", { variant: 'success' });
      } else {
        enqueueSnackbar("Errore durante la creazione della prima nota", { variant: 'error' });
        loadingSend.onFalse();
      }
    } catch (error) {
      console.error(error);
      loadingSend.onFalse();
    }
  });

  return (
    <FormProvider methods={methods}>
      <Card>
        <PrimaNotaNewEditDetails
          control={control}
          setValue={setValue}
          watch={watch}
        />
      </Card>

      <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
        <LoadingButton
          size="large"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
          onClick={handleCreateAndSend}
        >
          Salva
        </LoadingButton>
      </Stack>
    </FormProvider>
  );
}
