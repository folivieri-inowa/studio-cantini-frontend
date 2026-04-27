'use client';

import { useState } from 'react';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import VehicleCreateForm from '../vehicle-create-form';

// ----------------------------------------------------------------------

export default function VehicleCreateView() {
  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Nuovo Veicolo"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Gestione Auto', href: paths.dashboard.vehicles.root },
          { name: 'Nuovo Veicolo' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <VehicleCreateForm />
    </Container>
  );
}
