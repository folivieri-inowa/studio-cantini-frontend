import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { RHFSelect, RHFUpload, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import { useGetOwners } from '../../api/owner';
import Iconify from '../../components/iconify';
import axios, { endpoints } from '../../utils/axios';
import { PostDetailsSkeleton } from '../blog/post-skeleton';
import { useSettingsContext } from '../../components/settings';

// ----------------------------------------------------------------------

export default function PrimaNotaSpitDetails({ maxAmount, control, setValue, watch}) {
  const [ownersList, setOwnersList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [detailsList, setDetailsList] = useState([])
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { db }  = useSettingsContext();
  const {owners, ownersEmpty} = useGetOwners(db)
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
        const response = await axios.get(endpoints.category.list, { params: { db } });
        if (response.status === 200) {
          const categories = response.data.data;
          setCategoriesList(categories.sort((a, b) => a.name.localeCompare(b.name)));
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

  const PAYMENT_METHODS = ['Bonifico', 'Carte di Credito', 'Cbill', 'F24', 'PayPal', 'Addebito Diretto SEPA', 'POS', 'Altro'];

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

  const handleStatusChange = (event) => {
    setValue('status', event.target.value);
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

  if (loading) {
    return <PostDetailsSkeleton/>
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ color: 'text.disabled', mb: 3 }}>
        Crea/modifica una voce:
      </Typography>
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
            sx={{ maxWidth: '30%' }}
          >
            {STATUS.map((statusValue, index) => (
              <MenuItem key={`status-${index}`} value={statusValue.value}>
                {statusValue.name}
              </MenuItem>
            ))}
          </RHFSelect>
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                </InputAdornment>
              ),
            }}
            onChange={(e) => {
              const inputValue = parseFloat(e.target.value) || 0;
              const newValue = inputValue < 0 ? inputValue : inputValue * -1;
              
              // Arrotonda a 2 cifre decimali
              const roundedValue = Math.round(newValue * 100) / 100;
              
              // Limita il valore negativo al massimo importo scorporabile
              if (Math.abs(roundedValue) > Math.abs(maxAmount)) {
                setValue('negativeAmount', Math.round(maxAmount * 100) / 100);
              } else {
                setValue('negativeAmount', roundedValue);
              }
            }}
            disabled={maxAmount > 0}
          />
          <RHFTextField
            type="number"
            name="positiveAmount"
            label="Avere"
            placeholder="0.00"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                </InputAdornment>
              ),
            }}
            disabled={maxAmount < 0}
            onChange={(e) => {
              const inputValue = parseFloat(e.target.value) || 0;
              // Assicura che il valore sia sempre positivo e arrotondato a 2 cifre decimali
              const newValue = Math.round(Math.abs(inputValue) * 100) / 100;
              
              // Limita il valore positivo al massimo importo scorporabile
              const maxAbs = Math.round(Math.abs(maxAmount) * 100) / 100;
              if (newValue > maxAbs) {
                setValue('positiveAmount', maxAbs);
              } else {
                setValue('positiveAmount', newValue);
              }
            }}
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
          <RHFTextField name="description" label="Descrizione" InputLabelProps={{ shrink: true }} />
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
              sx={{ minWidth: '33%' }}
              renderInput={(params) => (
                <TextField {...params} label="Dettagli" placeholder="Seleziona un dettaglio" />
              )}
            />
          </Stack>
        </Stack>

        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Note</Typography>
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

        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
          <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
            <Typography variant="subtitle1">Documenti</Typography>
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
                onUpload={() => console.info('ON UPLOAD')}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />
    </Box>
  );
}

PrimaNotaSpitDetails.propTypes = {
  maxAmount: PropTypes.number,
  control: PropTypes.object,
  setValue: PropTypes.func,
  watch: PropTypes.func,
  trigger: PropTypes.func,
};
