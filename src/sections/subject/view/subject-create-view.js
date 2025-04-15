'use client';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import SubjectNewEditForm from '../subject-new-edit-form';

// ----------------------------------------------------------------------

export default function SubjectCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuovo Soggetto"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Soggetto',
            href: paths.dashboard.subject.root,
          },
          { name: 'Nuovo Soggetto' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <SubjectNewEditForm redirect />
    </Container>
  );
}
