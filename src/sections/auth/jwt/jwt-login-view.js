'use client';

import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha, useTheme } from '@mui/material/styles';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { useAuthContext } from 'src/auth/hooks';
import { PATH_AFTER_LOGIN } from 'src/config-global';

import Iconify from 'src/components/iconify';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

import { useSettingsContext } from '../../../components/settings';

// ----------------------------------------------------------------------

export default function JwtLoginView() {
  const { login } = useAuthContext();
  const settings = useSettingsContext();
  const theme = useTheme();

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
    email: Yup.string().required('Email/Username è un campo obbligatorio'),
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

  const renderDatabaseSelection = (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
        Seleziona il database
      </Typography>
      
      {loadingDatabases ? (
        <Grid container spacing={2}>
          {[1, 2].map((item) => (
            <Grid item xs={6} key={item}>
              <Skeleton 
                variant="rectangular" 
                height={64} 
                sx={{ borderRadius: 2 }} 
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {databases.map((db) => {
            const isSelected = methods.watch('db') === db.value;
            
            return (
              <Grid item xs={6} key={db.value}>
                <Card
                  onClick={() => {
                    settings.onChangeDb(db.value);
                    setValue('db', db.value);
                  }}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    position: 'relative',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isSelected 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: isSelected ? 'primary.main' : 'primary.light',
                      bgcolor: isSelected 
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.primary.main, 0.04),
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Radio
                      checked={isSelected}
                      sx={{ p: 0 }}
                      color="primary"
                    />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>
                      {db.label}
                    </Typography>
                    {isSelected && (
                      <Iconify 
                        icon="eva:checkmark-circle-2-fill" 
                        sx={{ 
                          color: 'primary.main',
                          width: 24,
                          height: 24,
                        }}
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );

  const renderForm = (
    <Stack spacing={2.5}>
      {!!errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      {renderDatabaseSelection}

      <RHFTextField name="email" label="Username o Email" />

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
