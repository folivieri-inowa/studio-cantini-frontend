import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { RHFSelect, RHFUpload, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import { useGetOwners } from '../../api/owner';
import Iconify from '../../components/iconify';
import axios, { endpoints } from '../../utils/axios';
import { useSnackbar } from '../../components/snackbar';
import { PostDetailsSkeleton } from '../blog/post-skeleton';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function PrimaNotaNewEditDetails({ control, setValue, watch, errors, edit=false, showExcludeFromStats=true}) {
  const [ownersList, setOwnersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [detailsList, setDetailsList] = useState([])
  const [loading, setLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState(false);
  
  // Stati per i dialog di creazione
  const [openNewCategoryDialog, setOpenNewCategoryDialog] = useState(false);
  const [openNewSubjectDialog, setOpenNewSubjectDialog] = useState(false);
  const [openNewDetailDialog, setOpenNewDetailDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newDetailName, setNewDetailName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [creatingDetail, setCreatingDetail] = useState(false);

  const { db } = useSettingsContext()
  const {owners, ownersEmpty} = useGetOwners(db)
  const { enqueueSnackbar } = useSnackbar();
  const values = watch();

  useEffect(() => {
    if (!ownersEmpty) {
      setOwnersList(owners);
    }
  }, [owners, ownersEmpty]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Create an array to store all requests
        const requests = [];

        // Always fetch categories
        const categoryRequest = await axios.get(endpoints.category.list, { params: { db } });
        requests.push(categoryRequest);

        // If in edit mode and we have category value, fetch subjects too
        if (edit && watch('category')) {
          const subjectRequest = axios.post(endpoints.subject.list, { db, categoryId: watch('category') });
          requests.push(subjectRequest);

          // If we have subject value too, fetch details
          if (watch('subject')) {
            const detailsRequest = axios.post(endpoints.detail.list, { db, subjectId: watch('subject') });
            requests.push(detailsRequest);
          }
        }

        // Execute all requests in parallel
        const responses = await Promise.all(requests);

        // Handle responses and sort alphabetically by name
        const categories = responses[0].data.data;
        setCategoriesList(categories.sort((a, b) => a.name.localeCompare(b.name)));

        if (responses[1]) {
          const subjects = responses[1].data.data;
          setSubjectList(subjects.sort((a, b) => a.name.localeCompare(b.name)));
        }

        if (responses[2]) {
          const details = responses[2].data.data;
          setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, []);

  const STATUS = [{name:'In Revisione', value:'pending'}, {name:'Completata', value:'completed'}, {name:'Da Controllare', value:'toCheck'}]

  const PAYMENT_METHODS = ['Bonifico', 'Carte di Credito', 'CBill', 'F24', 'PayPal', 'Addebito Diretto SEPA', 'POS', 'Altro'];

  const handleCategoryChange = async (newValue) => {
    setValue('category', newValue.id);
    const response = await axios.post(endpoints.subject.list, { db, categoryId: newValue.id });
    if (response.status === 200) {
      const subjects = response.data.data;
      setSubjectList(subjects.sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const handleSubjectChange = async (newValue) => {
    setValue('subject', newValue.id);
    const response = await axios.post(endpoints.detail.list, { db, subjectId: newValue.id });
    if (response.status === 200) {
      const details = response.data.data;
      setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
    }
  }

  const handleDetailsChange = (newValue) => {
    setValue('details', newValue.id);
  }

  const handleOwnerChange = (event) => {
    setValue('owner', event.target.value);
  };

  const handleStatusChange = async (event) => {
    setValue('status', event.target.value);
  }

  const handleUpdateDocuments = () => {
    const documents = watch('documents');
    const newDocuments = [];
    documents.map((document) => newDocuments.push({ url: document, isNew: true }))
    setValue('documents', newDocuments);
  }

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const files = values.documents || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('documents', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.documents]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.documents && values.documents?.filter((file) => file !== inputFile);
      setValue('documents', filtered);
    },
    [setValue, values.documents]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('documents', []);
  }, [setValue]);

  // Funzioni per aprire i dialog
  const handleOpenNewCategoryDialog = () => {
    setNewCategoryName('');
    setOpenNewCategoryDialog(true);
  };

  const handleOpenNewSubjectDialog = () => {
    if (!watch('category')) {
      enqueueSnackbar('Seleziona prima una categoria', { variant: 'warning' });
      return;
    }
    setNewSubjectName('');
    setOpenNewSubjectDialog(true);
  };

  const handleOpenNewDetailDialog = () => {
    if (!watch('subject')) {
      enqueueSnackbar('Seleziona prima un soggetto', { variant: 'warning' });
      return;
    }
    setNewDetailName('');
    setOpenNewDetailDialog(true);
  };
  
  // Funzioni per chiudere i dialog
  const handleCloseNewCategoryDialog = () => {
    setOpenNewCategoryDialog(false);
  };
  
  const handleCloseNewSubjectDialog = () => {
    setOpenNewSubjectDialog(false);
  };
  
  const handleCloseNewDetailDialog = () => {
    setOpenNewDetailDialog(false);
  };

  // Funzioni per creare nuovi elementi
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      enqueueSnackbar('Inserisci un nome per la categoria', { variant: 'error' });
      return;
    }

    try {
      setCreatingCategory(true);
      const response = await axios.post('/api/category/create', { db, name: newCategoryName.trim() });        if (response.status === 200) {
          // Aggiorniamo la lista delle categorie
          const categoryResponse = await axios.get(endpoints.category.list, { params: { db } });
          if (categoryResponse.status === 200) {
            const categories = categoryResponse.data.data;
            setCategoriesList(categories.sort((a, b) => a.name.localeCompare(b.name)));
            
            // Troviamo la categoria appena creata
            const newCategory = categories.find(cat => cat.name === newCategoryName.trim());
            if (newCategory) {
              setValue('category', newCategory.id);
              setValue('subject', null);
              setValue('details', null);
              setSubjectList([]);
              setDetailsList([]);
              enqueueSnackbar(`Categoria "${newCategoryName}" creata con successo`, { 
                variant: 'success',
                autoHideDuration: 2000
              });
            } else {
              enqueueSnackbar('Categoria creata con successo', { variant: 'success' });
            }
          }
          
          setOpenNewCategoryDialog(false);
        }
    } catch (error) {
      console.error('Errore durante la creazione della categoria:', error);
      enqueueSnackbar('Errore durante la creazione della categoria', { variant: 'error' });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) {
      enqueueSnackbar('Inserisci un nome per il soggetto', { variant: 'error' });
      return;
    }

    const categoryId = watch('category');
    if (!categoryId) {
      enqueueSnackbar('Seleziona prima una categoria', { variant: 'error' });
      return;
    }

    try {
      setCreatingSubject(true);
      const response = await axios.post('/api/subject/create', {
        db,
        name: newSubjectName.trim(),
        categoryId
      });        if (response.status === 200) {
          // Aggiorniamo la lista dei soggetti
          const subjectResponse = await axios.post(endpoints.subject.list, { db, categoryId });
          if (subjectResponse.status === 200) {
            const subjects = subjectResponse.data.data;
            setSubjectList(subjects.sort((a, b) => a.name.localeCompare(b.name)));
            
            // Troviamo il soggetto appena creato
            const newSubject = subjects.find(subj => subj.name === newSubjectName.trim());
            if (newSubject) {
              setValue('subject', newSubject.id);
              setValue('details', null);
              setDetailsList([]);
              
              // Carica i dettagli (saranno vuoti per un nuovo soggetto)
              const detailResponse = await axios.post(endpoints.detail.list, { db, subjectId: newSubject.id });
              if (detailResponse.status === 200) {
                const details = detailResponse.data.data;
                setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
              }
              
              enqueueSnackbar(`Soggetto "${newSubjectName}" creato con successo`, { 
                variant: 'success',
                autoHideDuration: 2000
              });
            } else {
              enqueueSnackbar('Soggetto creato con successo', { variant: 'success' });
            }
          }
          
          setOpenNewSubjectDialog(false);
        }
    } catch (error) {
      console.error('Errore durante la creazione del soggetto:', error);
      enqueueSnackbar('Errore durante la creazione del soggetto', { variant: 'error' });
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleCreateDetail = async () => {
    if (!newDetailName.trim()) {
      enqueueSnackbar('Inserisci un nome per il dettaglio', { variant: 'error' });
      return;
    }

    const subjectId = watch('subject');
    if (!subjectId) {
      enqueueSnackbar('Seleziona prima un soggetto', { variant: 'error' });
      return;
    }

    try {
      setCreatingDetail(true);
      const response = await axios.post('/api/detail/create', {
        db,
        name: newDetailName.trim(),
        subjectId
      });        if (response.status === 200) {
          // Aggiorniamo la lista dei dettagli
          const detailResponse = await axios.post(endpoints.detail.list, { db, subjectId });
          if (detailResponse.status === 200) {
            const details = detailResponse.data.data;
            setDetailsList(details.sort((a, b) => a.name.localeCompare(b.name)));
            
            // Troviamo il dettaglio appena creato
            const newDetail = details.find(detail => detail.name === newDetailName.trim());
            if (newDetail) {
              setValue('details', newDetail.id);
              enqueueSnackbar(`Dettaglio "${newDetailName}" creato con successo`, { 
                variant: 'success',
                autoHideDuration: 2000
              });
            } else {
              enqueueSnackbar('Dettaglio creato con successo', { variant: 'success' });
            }
          }
          
          setOpenNewDetailDialog(false);
        }
    } catch (error) {
      console.error('Errore durante la creazione del dettaglio:', error);
      enqueueSnackbar('Errore durante la creazione del dettaglio', { variant: 'error' });
    } finally {
      setCreatingDetail(false);
    }
  };

  if (loading) {
    return <PostDetailsSkeleton/>
  }

  return (
    <Box sx={{ p: 3 }}>
      <RHFTextField name="id" sx={{ display: 'none' }} />
      <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: '100%', mb: { xs: 3, md: 0 } }}
          justifyContent="space-between"
        >
          <RHFSelect
            name="owner"
            label="Intestatario Conto"
            InputLabelProps={{ shrink: true }}
            onChange={handleOwnerChange}
            sx={{ maxWidth: '50%' }}
          >
            {ownersList.map((owner, index) => (
              <MenuItem key={`owner-${index}`} value={owner.id}>
                {owner.name} | {owner.cc} | {owner.iban}
              </MenuItem>
            ))}
          </RHFSelect>

          <RHFSelect
            name="status"
            label="Stato"
            InputLabelProps={{ shrink: true }}
            onChange={handleStatusChange}
            sx={{ maxWidth: showExcludeFromStats ? '30%' : '50%' }}
          >
            {STATUS.map((statusValue, index) => (
              <MenuItem key={`status-${index}`} value={statusValue.value}>
                {statusValue.name}
              </MenuItem>
            ))}
          </RHFSelect>

          {showExcludeFromStats && (
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(watch('excludedFromStats'))}
                  onChange={(event) => setValue('excludedFromStats', event.target.checked)}
                  color="error"
                />
              }
              label="Escludi dalle statistiche"
              sx={{ maxWidth: '30%' }}
            />
          )}
        </Stack>
        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
          <Controller
            name="date"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <DatePicker
                label="Data"
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
          <RHFTextField
            type="number"
            name="negativeAmount"
            label="Dare"
            placeholder="0.00"
            inputProps={{ 
              step: "0.01",
              min: "-999999999.99", 
              max: "0" 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                </InputAdornment>
              ),
            }}
            onChange={(e) => {
              // Limitiamo a 2 cifre decimali
              let value = parseFloat(e.target.value);
              if (!Number.isNaN(value)) {
                value = Math.round(value * 100) / 100;
                const newValue = value < 0 ? value : value * -1;
                setValue('negativeAmount', newValue);
              }
            }}
            disabled={watch('amount') > 0}
          />
          <RHFTextField
            type="number"
            name="positiveAmount"
            label="Avere"
            placeholder="0.00"
            inputProps={{ 
              step: "0.01",
              min: "0", 
              max: "999999999.99" 
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                </InputAdornment>
              ),
            }}
            onChange={(e) => {
              // Limitiamo a 2 cifre decimali
              let value = parseFloat(e.target.value);
              if (!Number.isNaN(value)) {
                value = Math.round(value * 100) / 100;
                setValue('positiveAmount', value);
              }
            }}
            disabled={watch('amount') < 0}
          />
          <RHFSelect
            name="paymentType"
            label="Metodo di pagamento"
            InputLabelProps={{ shrink: true }}
          >
            {PAYMENT_METHODS.map((method, index) => (
              <MenuItem key={index} value={method}>
                {method}
              </MenuItem>
            ))}
          </RHFSelect>
        </Stack>

        <Stack spacing={2}>
          <RHFTextField 
            name="description" 
            label="Descrizione" 
            multiline
            rows={2}
            InputLabelProps={{ shrink: true }} />
        </Stack>

        <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
          <Stack direction="row" spacing={2} sx={{ width: '100%', mb: { xs: 3, md: 0 } }}>
            <RHFAutocomplete
              name="category"
              label="Categoria"
              options={categoriesList}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option; // In case option is a string
                const category = categoriesList.find((cat) => cat.id === option.id);
                return category ? category.name : '';
              }}
              isOptionEqualToValue={(option, val) => option.id === val.id}
              onChange={async (event, newValue) => {
                await handleCategoryChange(newValue);
                setValue('subject', null);
                setValue('details', null);
              }}
              value={categoriesList.find((cat) => cat.id === watch('category')) || null}
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
                <TextField 
                  {...params} 
                  label="Categoria *" 
                  placeholder="Seleziona una categoria"
                  error={!!errors?.category}
                  helperText={errors?.category?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        <Button 
                          color="primary"
                          variant="outlined"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenNewCategoryDialog();
                          }}
                          size="small"
                          title="Crea nuova categoria"
                          sx={{ 
                            minWidth: 'unset', 
                            ml: 1, 
                            px: 0.5,
                            py: 0.5,
                            borderRadius: '50%'
                          }}
                        >
                          <Iconify icon="eva:plus-fill" width={20} height={20} />
                        </Button>
                      </>
                    ),
                  }}
                />
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
                setValue('details', null);
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
                  label="Soggetto *"
                  placeholder="Seleziona un soggetto"
                  error={!!errors?.subject}
                  helperText={errors?.subject?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        {watch('category') && (
                          <Button 
                            color="primary"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenNewSubjectDialog();
                            }}
                            disabled={!watch('category')}
                            size="small"
                            title="Crea nuovo soggetto"
                            sx={{ 
                              minWidth: 'unset', 
                              ml: 1, 
                              px: 0.5,
                              py: 0.5,
                              borderRadius: '50%'
                            }}
                          >
                            <Iconify icon="eva:plus-fill" width={20} height={20} />
                          </Button>
                        )}
                      </>
                    ),
                  }}
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
              sx={{ minWidth: '33%' }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Dettagli" 
                  placeholder="Seleziona un dettaglio" 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {params.InputProps.endAdornment}
                        {watch('subject') && (
                          <Button 
                            color="primary"
                            variant="outlined"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenNewDetailDialog();
                            }}
                            disabled={!watch('subject')}
                            size="small"
                            title="Crea nuovo dettaglio"
                            sx={{ 
                              minWidth: 'unset', 
                              ml: 1, 
                              px: 0.5,
                              py: 0.5,
                              borderRadius: '50%'
                            }}
                          >
                            <Iconify icon="eva:plus-fill" width={20} height={20} />
                          </Button>
                        )}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        </Stack>

        <Accordion expanded={expandedNotes} onChange={() => setExpandedNotes(!expandedNotes)}>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1">Note</Typography>
              {watch('note') && !expandedNotes && (
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'inline-block',
                  }}
                />
              )}
              {watch('note') && !expandedNotes && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  (presente)
                </Typography>
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <RHFTextField
                name="note"
                label="Eventuali note"
                multiline
                rows={4}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedDocs} onChange={() => setExpandedDocs(!expandedDocs)}>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1">Documenti</Typography>
              {watch('documents') && watch('documents').length > 0 && !expandedDocs && (
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'inline-block',
                  }}
                />
              )}
              {watch('documents') && watch('documents').length > 0 && !expandedDocs && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  ({watch('documents').length} {watch('documents').length === 1 ? 'documento' : 'documenti'})
                </Typography>
              )}
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5} mt={2}>
              <Typography variant="subtitle2">Documenti da allegare</Typography>
              <RHFUpload
                multiple
                thumbnail
                name="documents"
                maxSize={10485760}
                onDrop={handleDrop}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
                // onUpload={() => console.info('ON UPLOAD')}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      {/* Dialog per creazione nuova categoria */}
      <Dialog 
        open={openNewCategoryDialog} 
        onClose={handleCloseNewCategoryDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuova Categoria</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Categoria"
            type="text"
            fullWidth
            variant="outlined"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingCategory) {
                e.preventDefault();
                handleCreateCategory();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewCategoryDialog} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateCategory}
            loading={creatingCategory}
            variant="contained"
            color="primary"
          >
            Crea Categoria
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog per creazione nuovo soggetto */}
      <Dialog 
        open={openNewSubjectDialog} 
        onClose={handleCloseNewSubjectDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuovo Soggetto</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Soggetto"
            type="text"
            fullWidth
            variant="outlined"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingSubject) {
                e.preventDefault();
                handleCreateSubject();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewSubjectDialog} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateSubject}
            loading={creatingSubject}
            variant="contained"
            color="primary"
          >
            Crea Soggetto
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Dialog per creazione nuovo dettaglio */}
      <Dialog 
        open={openNewDetailDialog} 
        onClose={handleCloseNewDetailDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Nuovo Dettaglio</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome Dettaglio"
            type="text"
            fullWidth
            variant="outlined"
            value={newDetailName}
            onChange={(e) => setNewDetailName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !creatingDetail) {
                e.preventDefault();
                handleCreateDetail();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDetailDialog} color="inherit">
            Annulla
          </Button>
          <LoadingButton
            onClick={handleCreateDetail}
            loading={creatingDetail}
            variant="contained"
            color="primary"
          >
            Crea Dettaglio
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

PrimaNotaNewEditDetails.propTypes = {
  control: PropTypes.object,
  setValue: PropTypes.func,
  watch: PropTypes.func,
  trigger: PropTypes.func,
  errors: PropTypes.object,
  edit: PropTypes.bool,
  showExcludeFromStats: PropTypes.bool,
};
