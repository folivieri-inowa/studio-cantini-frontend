'use client';

import { useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';

import Iconify from 'src/components/iconify';

import { CashFlowExpenseForm } from './cash-flow-expense-form';

// ----------------------------------------------------------------------

function formatCurrency(val) {
  return `€ ${parseFloat(val || 0).toFixed(2).replace('.', ',')}`;
}

function AttachmentIcon({ type }) {
  return (
    <Iconify
      icon={type === 'declaration' ? 'solar:file-text-outline' : 'solar:receipt-outline'}
      width={18}
      sx={{ color: type === 'declaration' ? 'warning.main' : 'info.main' }}
    />
  );
}

// ----------------------------------------------------------------------

export function CashFlowDetailsModal({
  open,
  onClose,
  item,
  onUpdateStatus,
  onExpenseCreate,
  onExpenseUpdate,
  onExpenseDelete,
  onAttachmentUpload,
  onAttachmentDelete,
  onRefresh,
  readOnly = false,
}) {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [savingExpense, setSavingExpense] = useState(false);
  const [attachingExpenseId, setAttachingExpenseId] = useState(null);

  if (!item) return null;

  const { expenses = [] } = item;
  const isOpen = item.status === 'open';
  const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  const handleExpenseSave = useCallback(async (data) => {
    setSavingExpense(true);
    try {
      if (data.id) {
        await onExpenseUpdate(data.id, data);
      } else {
        await onExpenseCreate({ cash_flow_id: item.id, ...data });
      }
      setShowExpenseForm(false);
      setEditingExpense(null);
      onRefresh?.();
    } finally {
      setSavingExpense(false);
    }
  }, [item?.id, onExpenseCreate, onExpenseUpdate, onRefresh]);

  const handleDeleteExpense = useCallback(async (id) => {
    if (!window.confirm('Eliminare questa spesa?')) return;
    await onExpenseDelete(id);
    onRefresh?.();
  }, [onExpenseDelete, onRefresh]);

  const handleFileUpload = useCallback(async (expenseId, file, type) => {
    const formData = new FormData();
    formData.append('expense_id', expenseId);
    formData.append('type', type);
    formData.append('file', file);
    await onAttachmentUpload(formData);
    setAttachingExpenseId(null);
    onRefresh?.();
  }, [onAttachmentUpload, onRefresh]);

  const handleDeleteAttachment = useCallback(async (attachmentId) => {
    if (!window.confirm('Eliminare questo allegato?')) return;
    await onAttachmentDelete(attachmentId);
    onRefresh?.();
  }, [onAttachmentDelete, onRefresh]);

  const openAttachment = (filename) => {
    window.open(`/api/cash-flow/attachment/${filename}`, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Dettaglio Prelievo</Typography>
          <Chip
            label={isOpen ? 'Aperto' : 'Chiuso'}
            color={isOpen ? 'warning' : 'success'}
            size="small"
            onClick={readOnly ? undefined : async () => {
              await onUpdateStatus(item.id, isOpen ? 'closed' : 'open');
              onRefresh?.();
            }}
            sx={{ cursor: readOnly ? 'default' : 'pointer' }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Header info */}
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">Conto</Typography>
              <Typography variant="body2">{item.owner_name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Data Prelievo</Typography>
              <Typography variant="body2">{item.withdrawal_date}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Importo</Typography>
              <Typography variant="body2" fontWeight="bold">{formatCurrency(item.amount)}</Typography>
            </Box>
          </Stack>
          {item.description && (
            <Box>
              <Typography variant="caption" color="text.secondary">Descrizione</Typography>
              <Typography variant="body2">{item.description}</Typography>
            </Box>
          )}
          {item.transaction_id && (
            <Box sx={{ bgcolor: 'info.lighter', p: 1.5, borderRadius: 1, border: '1px dashed', borderColor: 'info.main' }}>
              <Typography variant="caption" color="info.dark" fontWeight="bold">
                🔗 Collegato a Movimento Prima Nota
              </Typography>
              {item.transaction_date && (
                <Typography variant="body2" color="text.secondary">
                  Data: {item.transaction_date} — {formatCurrency(item.transaction_amount)}
                </Typography>
              )}
              {item.transaction_description && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{item.transaction_description}"
                </Typography>
              )}
            </Box>
          )}
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="caption" color="text.secondary">Totale Speso</Typography>
              <Typography variant="body2" color="warning.main">{formatCurrency(totalSpent)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Residuo prelievo</Typography>
              <Typography variant="body2" color="success.main">{formatCurrency(item.amount - totalSpent)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Saldo globale</Typography>
              <Typography variant="body2" color="info.main" fontWeight="bold">
                {formatCurrency(item.global_remaining ?? 0)}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Expenses section */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle1">Spese</Typography>
          {!readOnly && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-outline" />}
              onClick={() => { setShowExpenseForm(true); setEditingExpense(null); }}
            >
              Nuova Spesa
            </Button>
          )}
        </Stack>

        {showExpenseForm && (
          <Box sx={{ mb: 2 }}>
            <CashFlowExpenseForm
              initial={editingExpense}
              onSave={handleExpenseSave}
              onCancel={() => { setShowExpenseForm(false); setEditingExpense(null); }}
              saving={savingExpense}
            />
          </Box>
        )}

        {expenses.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Nessuna spesa registrata.</Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell align="right">Importo</TableCell>
                  <TableCell>Beneficiario</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell>Allegati</TableCell>
                  {!readOnly && <TableCell align="right" sx={{ width: 100 }}>Azioni</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.expense_date}</TableCell>
                    <TableCell align="right">{formatCurrency(exp.amount)}</TableCell>
                    <TableCell>{exp.recipient || '-'}</TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {(exp.attachments || []).map((att) => (
                          <IconButton
                            key={att.id}
                            size="small"
                            onClick={() => openAttachment(att.filename)}
                            title={`${att.original_name} (${att.type === 'declaration' ? 'Autodichiarazione' : 'Scontrino'})`}
                          >
                            <AttachmentIcon type={att.type} />
                          </IconButton>
                        ))}
                        {!readOnly && (<>
                          <IconButton
                            size="small"
                            onClick={() => setAttachingExpenseId(attachingExpenseId === exp.id ? null : exp.id)}
                            title="Allega file"
                          >
                            <Iconify icon="solar:paperclip-outline" width={16} />
                          </IconButton>
                          {attachingExpenseId === exp.id && (
                              <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                                <Button
                                  size="small"
                                  variant="text"
                                  component="label"
                                  sx={{ fontSize: 11, minWidth: 'auto', p: 0.5 }}
                                >
                                  🧾 Scontrino
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(exp.id, file, 'receipt');
                                    }}
                                  />
                                </Button>
                                <Button
                                  size="small"
                                  variant="text"
                                  component="label"
                                  sx={{ fontSize: 11, minWidth: 'auto', p: 0.5 }}
                                >
                                  📄 Dichiarazione
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/*,.pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(exp.id, file, 'declaration');
                                    }}
                                  />
                                </Button>
                              </Box>
                            )}
                          </>)}
                      </Stack>
                    </TableCell>
                      {!readOnly && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => { setEditingExpense(exp); setShowExpenseForm(true); }}
                          title="Modifica"
                        >
                          <Iconify icon="solar:pen-outline" width={16} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteExpense(exp.id)}
                          color="error"
                          title="Elimina"
                        >
                          <Iconify icon="solar:trash-bin-trash-outline" width={16} />
                        </IconButton>
                        {(exp.attachments || []).map((att) => (
                          <IconButton
                            key={`del-${att.id}`}
                            size="small"
                            onClick={() => handleDeleteAttachment(att.id)}
                            color="error"
                            title={`Elimina allegato ${att.original_name}`}
                          >
                            <Iconify icon="solar:paperclip-remove-outline" width={14} />
                          </IconButton>
                        ))}
                      </TableCell>
                      )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">Chiudi</Button>
      </DialogActions>
    </Dialog>
  );
}
