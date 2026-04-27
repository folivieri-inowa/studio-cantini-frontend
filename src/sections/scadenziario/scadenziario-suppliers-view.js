'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { alpha } from '@mui/material/styles';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_COLOR = { completed: 'success', overdue: 'error', upcoming: 'warning', future: 'info' };
const STATUS_LABEL = { completed: 'Pagato', overdue: 'Scaduto', upcoming: 'In scadenza', future: 'Da pagare' };

// ----------------------------------------------------------------------

export default function ScadenziarioSuppliersView({ scadenze = [] }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const suppliers = useMemo(() => {
    const map = {};
    for (const s of scadenze) {
      const name = s.companyName || s.company_name;
      if (!name) continue;
      if (!map[name]) {
        map[name] = {
          name,
          vatNumber: s.vatNumber || s.vat_number || null,
          invoices: [],
          total: 0,
          paid: 0,
          unpaid: 0,
          overdue: 0,
        };
      }
      const entry = map[name];
      const amount = parseFloat(s.amount) || 0;
      entry.invoices.push(s);
      entry.total += amount;
      if (s.status === 'completed') entry.paid += amount;
      else entry.unpaid += amount;
      if (s.status === 'overdue') entry.overdue += amount;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [scadenze]);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || s.vatNumber?.includes(q)
    );
  }, [suppliers, search]);

  const fmt = (v) =>
    parseFloat(v).toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">
          {suppliers.length} fornitore{suppliers.length !== 1 ? 'i' : ''}
        </Typography>
        <TextField
          size="small"
          placeholder="Cerca fornitore…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fornitore</TableCell>
              <TableCell align="right">Totale fatturato</TableCell>
              <TableCell align="right">Pagato</TableCell>
              <TableCell align="right">Da pagare</TableCell>
              <TableCell align="right">Scaduto</TableCell>
              <TableCell align="center">Fatture</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((supplier) => (
              <TableRow
                key={supplier.name}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelected(supplier)}
              >
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">{supplier.name}</Typography>
                  {supplier.vatNumber && (
                    <Typography variant="caption" color="text.secondary">P.IVA {supplier.vatNumber}</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Typography variant="subtitle2">{fmt(supplier.total)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">{fmt(supplier.paid)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="warning.main">{fmt(supplier.unpaid)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color={supplier.overdue > 0 ? 'error.main' : 'text.disabled'}>
                    {fmt(supplier.overdue)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={supplier.invoices.length} />
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Iconify icon="eva:arrow-ios-forward-fill" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">Nessun fornitore trovato</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ bgcolor: 'background.neutral' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack>
                  <Typography variant="h6">{selected.name}</Typography>
                  {selected.vatNumber && (
                    <Typography variant="caption" color="text.secondary">P.IVA {selected.vatNumber}</Typography>
                  )}
                </Stack>
                <IconButton onClick={() => setSelected(null)}>
                  <Iconify icon="eva:close-fill" />
                </IconButton>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Stack direction="row" spacing={2} mb={2} mt={1}>
                {[
                  { label: 'Totale', value: fmt(selected.total), color: 'primary' },
                  { label: 'Pagato', value: fmt(selected.paid), color: 'success' },
                  { label: 'Da pagare', value: fmt(selected.unpaid), color: 'warning' },
                  { label: 'Scaduto', value: fmt(selected.overdue), color: 'error' },
                ].map(({ label, value, color }) => (
                  <Box key={label} sx={{
                    flex: 1, p: 1.5, borderRadius: 1, textAlign: 'center',
                    bgcolor: (t) => alpha(t.palette[color].main, 0.08),
                  }}>
                    <Typography variant="h6" color={`${color}.main`}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Soggetto</TableCell>
                    <TableCell>N. Fattura</TableCell>
                    <TableCell>Scadenza</TableCell>
                    <TableCell align="right">Importo</TableCell>
                    <TableCell>Stato</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selected.invoices
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell>
                          <Typography variant="body2">{inv.subject}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {inv.invoiceNumber || inv.invoice_number || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {inv.date ? format(new Date(inv.date), 'dd MMM yyyy', { locale: it }) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {parseFloat(inv.amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Label variant="soft" color={STATUS_COLOR[inv.status] || 'default'}>
                            {STATUS_LABEL[inv.status] || inv.status}
                          </Label>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}
