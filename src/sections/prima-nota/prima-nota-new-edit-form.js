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

// eslint-disable-next-line react/prop-types
export default function PrimaNotaNewEditForm({ currentTransaction }) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const { db } = useSettingsContext();
  const loadingSend = useBoolean();

  const isEdit = Boolean(currentTransaction);

  const NewInvoiceSchema = Yup.object().shape({
    date: Yup.mixed().nullable().required('Data è un campo obbligatorio'),
    // amount: Yup.number().required('Importo è un campo obbligatorio'),
    description: Yup.string().required('Descrizione è un campo obbligatorio'),
    paymentType: Yup.string().required('Metodo di pagamento è un campo obbligatorio'),
    category: Yup.string().required('Categoria è un campo obbligatorio'),
    subject: Yup.string().required('Soggetto è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      owner: currentTransaction?.owner || '',
      date: currentTransaction?.date ? new Date(currentTransaction.date) : new Date(),
      amount: currentTransaction?.amount || null,
      description: currentTransaction?.description || '',
      paymentType: currentTransaction?.paymentType || '',
      note: currentTransaction?.note || '',
      category: currentTransaction?.category || '',
      subject: currentTransaction?.subject || '',
      detail: currentTransaction?.detail || '',
      documents: currentTransaction?.documents?.map(doc => doc.url) || [],
      status: currentTransaction?.status || 'completed',
      positiveAmount: currentTransaction?.amount > 0 ? Math.abs(currentTransaction.amount) : null,
      negativeAmount: currentTransaction?.amount < 0 ? Math.abs(currentTransaction.amount) : null,
      id: currentTransaction?.id,
    }),
    [currentTransaction]
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
    trigger,
    formState: { isSubmitting, errors },
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

  // Funzione per gestire il salvataggio con o senza stato completato
  const handleSaveWithStatus = (setCompleted) => 
    handleSubmit(async (data) => {
      // Attiva la validazione dei campi
      await trigger('category');
      await trigger('subject');
  
      // Verifica che sia specificata almeno categoria e soggetto
      if (!data.category) {
        enqueueSnackbar('È necessario specificare una categoria', { variant: 'error' });
        return;
      }
  
      if (!data.subject) {
        enqueueSnackbar('È necessario specificare un soggetto', { variant: 'error' });
        return;
      }

    loadingSend.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const documentsUrl = await handleUploadFiles(data.documents);

      const dataToSend = {
        ...data,
        db,
        amount: parseFloat(data.positiveAmount || -data.negativeAmount),
        documents: documentsUrl || [],
        status: setCompleted ? 'completed' : data.status, // Imposta lo stato a 'completed' solo se richiesto
      }

      let response;

      if (isEdit) {
        // Se siamo in modalità modifica
        response = await axios.post('/api/prima-nota/update', dataToSend);
        if (response.status === 200) {
          loadingSend.onFalse();
          router.push(paths.dashboard.prima_nota.root);
          const message = setCompleted ? 
            "Prima nota aggiornata e completata con successo" : 
            "Prima nota aggiornata con successo";
          enqueueSnackbar(message, { variant: 'success' });
        } else {
          enqueueSnackbar("Errore durante l'aggiornamento della prima nota", { variant: 'error' });
          loadingSend.onFalse();
        }
      } else {
        // Se siamo in modalità creazione
        response = await axios.post('/api/prima-nota/create', dataToSend);
        if (response.status === 200) {
          reset();
          loadingSend.onFalse();
          router.push(paths.dashboard.prima_nota.root);
          enqueueSnackbar("Prima nota creata con successo", { variant: 'success' });
        } else {
          enqueueSnackbar("Errore durante la creazione della prima nota", { variant: 'error' });
          loadingSend.onFalse();
        }
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
          errors={errors}
          trigger={trigger}
        />
      </Card>

      <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
        {!isEdit && (
          <LoadingButton
            size="large"
            variant="contained"
            loading={loadingSend.value && isSubmitting}
            onClick={handleSaveWithStatus(false)}
          >
            Salva
          </LoadingButton>
        )}
        
        {isEdit && (
          <>
            <LoadingButton
              size="large"
              variant="contained"
              color="primary"
              loading={loadingSend.value && isSubmitting}
              onClick={handleSaveWithStatus(false)}
              sx={{ mr: 1 }}
            >
              Aggiorna
            </LoadingButton>
            
            <LoadingButton
              size="large"
              variant="contained"
              color="success"
              loading={loadingSend.value && isSubmitting}
              onClick={handleSaveWithStatus(true)}
            >
              Aggiorna e completa
            </LoadingButton>
          </>
        )}
      </Stack>
    </FormProvider>
  );
}

