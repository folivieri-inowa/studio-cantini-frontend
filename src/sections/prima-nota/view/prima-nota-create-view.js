'use client';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PrimaNotaNewEditForm from '../prima-nota-new-edit-form';

// ----------------------------------------------------------------------

export default function PrimaNotaCreateView() {
  const settings = useSettingsContext();

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
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PrimaNotaNewEditForm />
    </Container>
  );
}
