'use client';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { useGetCategories } from '../../../api/category';
import CategoryNewEditForm from '../category-new-edit-form';

// ----------------------------------------------------------------------

export default function CategoryCreateView() {
  const settings = useSettingsContext();
  const { categories, refetchCategories } = useGetCategories(settings.db);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Nuova Categoria"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Elenco Categorie',
            href: paths.dashboard.category.list,
          },
          { name: 'Nuova Categoria' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <CategoryNewEditForm handleUpdate={refetchCategories} categoryData={categories} />
    </Container>
  );
}
