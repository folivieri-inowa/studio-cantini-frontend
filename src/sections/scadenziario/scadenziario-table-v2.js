'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import { alpha } from '@mui/material/styles';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import {
  useTable,
  TableNoData,
  TableSkeleton,
  TableEmptyRows,
  emptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'subject',     label: 'Soggetto' },
  { id: 'type',        label: 'Tipo' },
  { id: 'company_name',label: 'Fornitore' },
  { id: 'date',        label: 'Scadenza' },
  { id: 'amount',      label: 'Importo', align: 'right' },
  { id: 'paymentDate', label: 'Pagato il' },
  { id: 'status',      label: 'Stato' },
  { id: '',            width: 88 },
];

const STATUS_COLOR = {
  completed: 'success',
  overdue:   'error',
  upcoming:  'warning',
  future:    'info',
};

const STATUS_LABEL = {
  completed: 'Pagato',
  overdue:   'Scaduto',
  upcoming:  'In scadenza',
  future:    'Da pagare',
};

const STATUS_ICON = {
  completed: 'eva:checkmark-circle-fill',
  overdue:   'eva:alert-triangle-fill',
  upcoming:  'eva:clock-fill',
  future:    'eva:calendar-outline',
};

const TYPE_LABEL = {
  fattura:    'Fattura',
  rata:       'Rata',
  fiscale:    'Fiscale',
  ricorrente: 'Ricorrente',
  altro:      'Altro',
};

// ----------------------------------------------------------------------

function ScadenziarioRow({ row, onDeleteRow, onEditRow, onViewRow, onPayRow }) {
  const confirm = useBoolean();

  const statusColor = STATUS_COLOR[row.status] || 'default';

  return (
    <>
      <TableRow
        hover
        sx={{
          transition: 'all 0.2s',
          borderLeft: (theme) => `4px solid ${
            theme.palette[statusColor]?.main || theme.palette.divider
          }`,
          ...(row.status === 'overdue' && {
            bgcolor: (theme) => alpha(theme.palette.error.lighter, 0.12),
          }),
          ...(row.status === 'upcoming' && {
            bgcolor: (theme) => alpha(theme.palette.warning.lighter, 0.12),
          }),
          '&:hover': {
            boxShadow: (theme) => theme.customShadows?.z8,
            bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.12),
            transform: 'translateY(-1px)',
          },
        }}
      >
        <TableCell>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {row.subject}
          </Typography>
          {row.companyName && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.companyName}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {TYPE_LABEL[row.type] || row.type || '—'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap>
            {row.companyName || row.invoiceNumber || '—'}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Iconify icon="eva:calendar-fill" sx={{ color: 'text.disabled', width: 16, height: 16 }} />
            <Typography variant="body2">
              {row.date ? format(new Date(row.date), 'dd MMM yyyy', { locale: it }) : '—'}
            </Typography>
          </Box>
        </TableCell>

        <TableCell align="right">
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ color: parseFloat(row.amount) > 1000 ? 'error.main' : 'text.primary' }}
          >
            {row.amount
              ? parseFloat(row.amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
              : '€ 0,00'}
          </Typography>
        </TableCell>

        <TableCell>
          {row.paymentDate ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Iconify icon="eva:checkmark-circle-fill" sx={{ color: 'success.main', width: 16, height: 16 }} />
              <Typography variant="body2">
                {format(new Date(row.paymentDate), 'dd MMM yyyy', { locale: it })}
              </Typography>
            </Box>
          ) : '—'}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={statusColor}
            startIcon={<Iconify icon={STATUS_ICON[row.status] || 'eva:info-fill'} />}
            sx={{ '& .MuiChip-label': { fontWeight: 'bold' } }}
          >
            {STATUS_LABEL[row.status] || row.status}
          </Label>
        </TableCell>

        <TableCell align="right">
          <Stack direction="row" spacing={0.75} justifyContent="flex-end">
            {row.status !== 'completed' && (
              <Tooltip title="Segna come pagato">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => onPayRow?.(row.id)}
                  sx={{
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                    '&:hover': { bgcolor: (theme) => alpha(theme.palette.success.main, 0.16) },
                  }}
                >
                  <Iconify icon="eva:checkmark-fill" width={16} height={16} />
                </IconButton>
              </Tooltip>
            )}

            <IconButton
              size="small"
              color="primary"
              onClick={() => onViewRow?.(row.id)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16) },
              }}
            >
              <Iconify icon="eva:eye-fill" width={16} height={16} />
            </IconButton>

            <IconButton
              size="small"
              color="info"
              onClick={() => onEditRow?.(row.id)}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.info.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.info.main, 0.16) },
              }}
            >
              <Iconify icon="eva:edit-fill" width={16} height={16} />
            </IconButton>

            <IconButton
              size="small"
              color="error"
              onClick={confirm.onTrue}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.16) },
              }}
            >
              <Iconify icon="eva:trash-2-fill" width={16} height={16} />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina scadenza"
        content="Sei sicuro di voler eliminare questa scadenza?"
        action={
          <Button variant="contained" color="error" onClick={() => { onDeleteRow?.(row.id); confirm.onFalse(); }}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

function GroupHeaderRow({ groupId, groupName, rows, expanded, onToggle, onDeleteGroup }) {
  const confirm = useBoolean();
  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const paidCount   = rows.filter((r) => r.status === 'completed').length;

  return (
    <>
      <TableRow
        sx={{
          cursor: 'pointer',
          bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.25),
          borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
          '&:hover': { bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.4) },
        }}
        onClick={onToggle}
      >
        <TableCell colSpan={5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon={expanded ? 'eva:arrow-down-fill' : 'eva:arrow-right-fill'}
              sx={{ color: 'primary.main', width: 18, height: 18 }}
            />
            <Iconify icon="solar:calendar-bold" sx={{ color: 'primary.main', width: 18, height: 18 }} />
            <Typography variant="subtitle2" color="primary.main">
              {groupName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              — {rows.length} rate · {paidCount}/{rows.length} pagate
            </Typography>
          </Stack>
        </TableCell>

        <TableCell align="right">
          <Typography variant="subtitle2" color="primary.main">
            {totalAmount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
          </Typography>
        </TableCell>

        <TableCell />

        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Elimina rate non pagate">
            <IconButton
              size="small"
              color="error"
              onClick={confirm.onTrue}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                '&:hover': { bgcolor: (theme) => alpha(theme.palette.error.main, 0.16) },
              }}
            >
              <Iconify icon="eva:trash-2-fill" width={16} height={16} />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina gruppo rate"
        content={
          <>
            Verranno eliminate le rate <strong>non ancora pagate</strong> del piano{' '}
            <strong>{groupName}</strong>. Le rate già pagate verranno mantenute.
          </>
        }
        action={
          <Button variant="contained" color="error" onClick={() => { onDeleteGroup?.(groupId); confirm.onFalse(); }}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

// ----------------------------------------------------------------------

export default function ScadenziarioTableV2({
  scadenze = [],
  loading = false,
  onMutate,
  onViewRow,
  onEditRow,
}) {
  const table = useTable();
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const { grouped, ungrouped } = useMemo(() => {
    const groups = {};
    const ungroupedItems = [];
    for (const s of scadenze) {
      if (s.groupId) {
        if (!groups[s.groupId]) groups[s.groupId] = [];
        groups[s.groupId].push(s);
      } else {
        ungroupedItems.push(s);
      }
    }
    return { grouped: groups, ungrouped: ungroupedItems };
  }, [scadenze]);

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const handleDeleteRow = useCallback(async (id) => {
    try {
      const { deleteScadenziario } = await import('src/api/scadenziario-services');
      await deleteScadenziario(id);
      onMutate?.();
    } catch (err) {
      console.error(err);
    }
  }, [onMutate]);

  const handleDeleteGroup = useCallback(async (groupId) => {
    try {
      const { deleteGroup } = await import('src/api/scadenziario-services');
      await deleteGroup(groupId);
      onMutate?.();
    } catch (err) {
      console.error(err);
    }
  }, [onMutate]);

  const handlePayRow = useCallback(async (id) => {
    try {
      const { updatePaymentStatus } = await import('src/api/scadenziario-services');
      const today = new Date().toISOString().substring(0, 10);
      await updatePaymentStatus(id, today, 'completed');
      onMutate?.();
    } catch (err) {
      console.error(err);
    }
  }, [onMutate]);

  const paginatedUngrouped = ungrouped.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const notFound = !loading && scadenze.length === 0;
  const denseHeight = table.dense ? 56 : 76;

  return (
    <Card>
      <Scrollbar>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={TABLE_HEAD}
              rowCount={ungrouped.length}
              numSelected={table.selected.length}
              onSort={table.onSort}
              sx={{
                '& .MuiTableCell-root': {
                  bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.2),
                  fontWeight: 'bold',
                },
              }}
            />

            <TableBody>
              {loading ? (
                [...Array(table.rowsPerPage)].map((_, index) => (
                  <TableSkeleton key={index} sx={{ height: denseHeight }} />
                ))
              ) : (
                <>
                  {notFound && <TableNoData notFound sx={{ py: 10 }} />}

                  {/* Gruppi collassabili */}
                  {Object.entries(grouped).map(([groupId, rows]) => {
                    const expanded = expandedGroups.has(groupId);
                    const groupName = rows[0]?.subject?.split(' — Rata')?.[0] || `Gruppo ${groupId.slice(0, 8)}`;

                    return (
                      <Box component="tbody" key={groupId} sx={{ display: 'contents' }}>
                        <GroupHeaderRow
                          groupId={groupId}
                          groupName={groupName}
                          rows={rows}
                          expanded={expanded}
                          onToggle={() => toggleGroup(groupId)}
                          onDeleteGroup={handleDeleteGroup}
                        />
                        {expanded && rows.map((row) => (
                          <ScadenziarioRow
                            key={row.id}
                            row={row}
                            onDeleteRow={handleDeleteRow}
                            onEditRow={onEditRow}
                            onViewRow={onViewRow}
                            onPayRow={handlePayRow}
                          />
                        ))}
                      </Box>
                    );
                  })}

                  {/* Scadenze senza gruppo */}
                  {paginatedUngrouped.map((row) => (
                    <ScadenziarioRow
                      key={row.id}
                      row={row}
                      onDeleteRow={handleDeleteRow}
                      onEditRow={onEditRow}
                      onViewRow={onViewRow}
                      onPayRow={handlePayRow}
                    />
                  ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, ungrouped.length)}
                  />
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      <TablePaginationCustom
        count={ungrouped.length}
        page={table.page}
        rowsPerPage={table.rowsPerPage}
        onPageChange={table.onChangePage}
        onRowsPerPageChange={table.onChangeRowsPerPage}
        dense={table.dense}
        onChangeDense={table.onChangeDense}
      />
    </Card>
  );
}
