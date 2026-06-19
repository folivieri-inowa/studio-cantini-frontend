'use client';

import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSnackbar } from 'src/components/snackbar';

import { useGetGroups, deleteGroup } from '../../../api/groups';
import GroupCreateEditModal from '../group-create-edit-modal';

export default function GroupsView() {
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const { groups, groupsLoading, refetchGroups } = useGetGroups(settings.db);

  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);

  const handleCreate = () => {
    setEditGroup(null);
    setModalOpen(true);
  };

  const handleEdit = (group) => {
    setEditGroup(group);
    setModalOpen(true);
  };

  const handleDelete = useCallback(async (group) => {
    try {
      const response = await deleteGroup(group.id, settings.db);
      if (response.status === 200) {
        enqueueSnackbar(response.data?.message || 'Gruppo eliminato con successo', { variant: 'success' });
        refetchGroups();
      }
    } catch (error) {
      const msg = error.response?.data?.error || "Errore durante l'eliminazione";
      enqueueSnackbar(msg, { variant: 'error' });
    }
  }, [settings.db, enqueueSnackbar, refetchGroups]);

  const handleModalClose = (saved) => {
    setModalOpen(false);
    setEditGroup(null);
    if (saved) refetchGroups();
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Gruppi Categorie"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Gruppi' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleCreate}
          >
            Nuovo Gruppo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Categorie</TableCell>
                  <TableCell align="right">Azioni</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupsLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" sx={{ py: 4 }}>Caricamento...</Typography>
                    </TableCell>
                  </TableRow>
                ) : groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" sx={{ py: 4, color: 'text.secondary' }}>
                        Nessun gruppo creato. Crea il primo gruppo per raggruppare le categorie nella dashboard.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{group.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                          {group.items_count > 0 ? (
                            <Chip label={`${group.items_count} categorie`} size="small" variant="outlined" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">Nessuna categoria</Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleEdit(group)} color="primary">
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(group)} color="error">
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <GroupCreateEditModal
        open={modalOpen}
        onClose={handleModalClose}
        editGroup={editGroup}
        db={settings.db}
      />
    </Container>
  );
}
