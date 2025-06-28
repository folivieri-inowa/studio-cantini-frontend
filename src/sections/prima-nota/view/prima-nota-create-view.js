'use client';

import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import FormProvider, { RHFUpload, RHFSelect, RHFAutocomplete } from 'src/components/hook-form';

import axios, { endpoints } from '../../../utils/axios';
import Iconify from '../../../components/iconify';
import { useGetOwners } from '../../../api/owner';
import { useBoolean } from '../../../hooks/use-boolean';
import { useGetCategories } from '../../../api/category';
import { useSnackbar } from '../../../components/snackbar';
import PrimaNotaNewEditForm from '../prima-nota-new-edit-form';


// ----------------------------------------------------------------------

export default function PrimaNotaCreateView() {
  const dialog = useBoolean();
  const settings = useSettingsContext();
  const { db } = settings;
  const { owners, ownersEmpty } = useGetOwners(db)
  const { categories, categoriesEmpty } = useGetCategories(db);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuova voce"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Prima Nota',
            href: paths.dashboard.prima_nota.root,
          },
          { name: 'Nuova voce' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={dialog.onTrue}
          >
            Carica file
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PrimaNotaNewEditForm />

      { !ownersEmpty && <UploadDialog dialog={dialog} owners={owners} db={db} categories={categories} />}
    </Container>
  );
}

const UploadDialog = ({ dialog, owners, db, categories }) => {
  const [subjectList, setSubjectList] = useState([]);
  const [detailsList, setDetailsList] = useState([]);

  const router = useRouter();
  const loadingSend = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const defaultValues = useMemo(
    () => ({
      file: null,
      owner: '',
      category: '',
      subject: '',
      details: '',
    }),
    []
  );

  const methods = useForm({
    defaultValues,
  });

  const {
    setValue,
    watch,
    reset,
    handleSubmit,
  } = methods;

  const values = watch();

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const files = values.documents || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('file', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.documents]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.file && values.file?.filter((file) => file !== inputFile);
      setValue('file', filtered);
    },
    [setValue, values.file]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('file', []);
  }, [setValue]);

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      loadingSend.onFalse();

      const formData = new FormData();

      if (data.file && data.file[0]) {
        formData.append('file', data.file[0]); // Il file viene inviato normalmente
      }

      formData.append('metadata', JSON.stringify({
        db,
        owner: data.owner,
        category: data.category,
        subject: data.subject,
        details: data.details
      }));

      const response = await axios.post('/api/prima-nota/import', formData);
      if (response.status === 200) {
        dialog.onFalse();
        router.push(paths.dashboard.prima_nota.root);
        reset();
        enqueueSnackbar('File caricato con successo!');
      }else{
        enqueueSnackbar('Si è verificato un errore');
      }
    } catch (error) {
      console.error(error);
      loadingSend.onFalse();
    }
  });

  const handleOwnerChange = (event) => {
    setValue('owner', event.target.value);
  }

  const handleCategoryChange = async (newValue) => {
    setValue('category', newValue.id);
    setValue('subject', null);
    setValue('details', null);
    const response = await axios.post(endpoints.subject.list, { db, categoryId: newValue.id });
    if (response.status === 200) {
      const subjects = response.data.data;
      setSubjectList(subjects.sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleSubjectChange = async (newValue) => {
    setValue('subject', newValue.id);
    setValue('details', null);
    const response = await axios.post(endpoints.detail.list, { db, subjectId: newValue.id });
    if (response.status === 200) {
      const details = response.data.data;
      setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  const handleDetailsChange = (newValue) => {
    setValue('details', newValue.id);
  }

  return (
    <Dialog
      open={dialog.value}
      onClose={dialog.onFalse}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Importa dati da file
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={dialog.onFalse}
        sx={() => ({
          position: 'absolute',
          right: 8,
          top: 8,
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ mb: 4}}>
        <FormProvider methods={methods}>
          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ mt: 1}}>
            <RHFSelect
              name="owner"
              label="Intestatario Conto"
              InputLabelProps={{ shrink: true }}
              onChange={handleOwnerChange}
            >
              {owners.map((owner, index) => (
                <MenuItem key={`owner-${index}`} value={owner.id}>
                  {owner.name} | {owner.cc} | {owner.iban}
                </MenuItem>
              ))}
            </RHFSelect>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <RHFAutocomplete
              name="category"
              label="Categoria"
              options={categories}
              value={categories.find((cat) => cat.id === watch('category')) || null}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option; // In case option is a string
                const category = categories.find((cat) => cat.id === option.id);
                return category ? category.name : '';
              }}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              onChange={async (event, newValue) => {
                await handleCategoryChange(newValue);
              }}
              renderOption={(props, option) => (
                <li
                  {...props}
                  key={option.id}
                  style={{ fontWeight: option.id === 'new' ? 'bold' : 'normal' }}
                >
                  {option.name}
                </li>
              )}
              sx={{ minWidth: '33%' }}
              renderInput={(params) => (
                <TextField {...params} label="Categoria" placeholder="Seleziona una categoria" />
              )}
            />

            <RHFAutocomplete
              name="subject"
              label="Soggetto"
              options={subjectList}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                const subject = subjectList.find((cat) => cat.id === (option.id || option));
                return subject ? subject.name : '';
              }}
              isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
              onChange={async (event, newValue) => {
                await handleSubjectChange(newValue);
              }}
              value={subjectList.find((cat) => cat.id === watch('subject')) || null}
              disabled={subjectList.length === 0}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              sx={{ minWidth: '33%' }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Soggetto"
                  placeholder="Seleziona un soggetto"
                />
              )}
            />

            <RHFAutocomplete
              name="details"
              label="Dettagli"
              options={detailsList}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                const detail = detailsList.find((cat) => cat.id === (option.id || option));
                return detail ? detail.name : '';
              }}
              isOptionEqualToValue={(option, val) => option?.id === (val?.id || val)}
              onChange={(event, newValue) => {
                handleDetailsChange(newValue);
              }}
              value={detailsList.find((cat) => cat.id === watch('details')) || null}
              disabled={detailsList.length === 0}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              sx={{ minWidth: '32%' }}
              renderInput={(params) => (
                <TextField {...params} label="Dettagli" placeholder="Seleziona un dettaglio" />
              )}
            />

          </Stack>
            <RHFUpload
              // thumbnail
              multiple
              accept="application/*"
              name="file"
              maxSize={10485760}
              onDrop={handleDrop}
              onRemove={handleRemoveFile}
              onRemoveAll={handleRemoveAllFiles}
              onUpload={handleCreateAndSend}
            />
          </Stack>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

UploadDialog.propTypes = {
  dialog: PropTypes.object,
  owners: PropTypes.array,
  categories: PropTypes.array,
  db: PropTypes.object,
}
