'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useGetVehicles } from 'src/api/vehicles';

import VehicleTableRow from '../vehicle-table-row';
import VehicleTableToolbar from '../vehicle-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'plate', label: 'Targa' },
  { id: 'make_model', label: 'Marca / Modello' },
  { id: 'owner_name', label: 'Intestatario' },
  { id: 'assignee_name', label: 'Assegnatario' },
  { id: 'status', label: 'Stato' },
  { id: 'availability_type', label: 'Disponibilità' },
  { id: '', width: 80 },
];

const defaultFilters = {
  search: '',
  status: '',
  ownerType: '',
  availabilityType: '',
  assigneeName: '',
};

// ----------------------------------------------------------------------

export default function VehicleListView() {
  const table = useTable({ defaultRowsPerPage: 25 });
  const router = useRouter();
  const confirm = useBoolean();

  const [filters, setFilters] = useState(defaultFilters);

  const { vehicles, vehiclesLoading, vehiclesEmpty, vehiclesMutate } = useGetVehicles(filters);

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    [table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.vehicles.details(id));
    },
    [router]
  );

  const dataInPage = vehicles.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const notFound = !vehiclesLoading && vehiclesEmpty;

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading="Gestione Auto"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Gestione Auto' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => router.push(paths.dashboard.vehicles.new)}
          >
            Nuovo Veicolo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <VehicleTableToolbar
          filters={filters}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
        />

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={TABLE_HEAD}
                rowCount={vehicles.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {vehiclesLoading
                  ? [...Array(5)].map((_, i) => (
                      <VehicleTableRow key={i} row={null} loading />
                    ))
                  : dataInPage.map((row) => (
                      <VehicleTableRow
                        key={row.id}
                        row={row}
                        onViewRow={() => handleViewRow(row.id)}
                        onMutate={vehiclesMutate}
                      />
                    ))}

                <TableEmptyRows
                  height={72}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, vehicles.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <TablePaginationCustom
          count={vehicles.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>
    </Container>
  );
}
