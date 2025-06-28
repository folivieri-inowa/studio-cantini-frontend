'use client';

import * as Yup from 'yup';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFSelect, RHFTextField } from 'src/components/hook-form';
import MenuItem from '@mui/material/MenuItem';
import { useSettingsContext } from '../../../components/settings';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const { login } = useAuthContext();
  const settings = useSettingsContext();

  const [databases, setDatabases] = useState([]);
  const [loadingDatabases, setLoadingDatabases] = useState(true);

  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');

  const searchParams = useSearchParams();

  const returnTo = searchParams.get('returnTo');

  const password = useBoolean();

  // Carica dinamicamente i database disponibili
  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        setLoadingDatabases(true);
        const backendUrl = process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9000';
        const response = await fetch(`${backendUrl}/v1/databases/list`);
        const data = await response.json();
        
        if (data.success) {
          setDatabases(data.databases);
        } else {
          console.error('Errore nel caricamento dei database:', data.message);
          // Fallback ai database hardcoded in caso di errore
          setDatabases([
            { value: 'db1', label: 'Guido' },
            { value: 'db2', label: 'Marta' },
          ]);
        }
      } catch (error) {
        console.error('Errore nella chiamata API per i database:', error);
        // Fallback ai database hardcoded in caso di errore
        setDatabases([
          { value: 'db1', label: 'Guido' },
          { value: 'db2', label: 'Marta' },
        ]);
      } finally {
        setLoadingDatabases(false);
      }
    };

    fetchDatabases();
  }, []);

  const LoginSchema = Yup.object().shape({
    db: Yup.string().required('Database è un campo obbligatorio'),
    email: Yup.string().required('Email è un campo obbligatorio').email('Email deve essere un indirizzo email valido'),
    password: Yup.string().required('Password è un campo obbligatorio'),
  });

  const defaultValues = {
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await login?.(data.email, data.password, data.db);

      router.push(returnTo || PATH_AFTER_LOGIN);
    } catch (error) {
      console.error(error);
      reset();
      setErrorMsg(typeof error === 'string' ? error : error.message);
    }
  });

  const renderHead = (
    <Stack spacing={2} sx={{ mb: 5 }}>
      <Typography variant="h4">Accedi</Typography>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      <RHFSelect
        name="db"
        label="Database"
        disabled={loadingDatabases}
        options={databases}
        onChange={(event)=>{
          settings.onChangeDb(event.target.value)
          setValue('db', event.target.value)
        }}
      >
        {databases.map((value, index)=>(
          <MenuItem key={index} value={value.value}>
            {value.label}
          </MenuItem>
        ))}
      </RHFSelect>

      <RHFTextField name="email" label="Email address" />

      <RHFTextField
        name="password"
        label="Password"
        type={password.value ? 'text' : 'password'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Link variant="body2" color="inherit" underline="always" sx={{ alignSelf: 'flex-end' }}>
        Password dimenticata?
      </Link>

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
      >
        Accedi
      </LoadingButton>
    </Stack>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      {renderHead}
      {renderForm}
    </FormProvider>
  );
}
