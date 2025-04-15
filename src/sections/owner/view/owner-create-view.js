'use client';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import OwnerNewEditForm from '../owner-new-edit-form';

// ----------------------------------------------------------------------

export default function OwnerCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuovo Conto Corrente"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Elenco Conti Correnti',
            href: paths.dashboard.owner.root,
          },
          { name: 'Nuovo Conto Corrente' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <OwnerNewEditForm />
    </Container>
  );
}
