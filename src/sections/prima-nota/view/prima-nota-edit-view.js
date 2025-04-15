'use client';

import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PrimaNotaNewEditForm from '../prima-nota-new-edit-form';
import { useGetPrimaNotaDetail } from '../../../api/prima-nota';

// ----------------------------------------------------------------------

export default function PrimaNotaEditView({ id }) {
  const settings = useSettingsContext();

  const { transaction: currentTransaction, transactionLoading } = useGetPrimaNotaDetail(id);

  if (transactionLoading) return null;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Prima Nota',
            href: paths.dashboard.prima_nota.root,
          },
          { name: "Modifica" },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PrimaNotaNewEditForm currentTransaction={currentTransaction} />
    </Container>
  );
}

PrimaNotaEditView.propTypes = {
  id: PropTypes.string,
};
