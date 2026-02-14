'use client';

import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import DocumentStatusChip from './document-status-chip';
import DocumentPriorityBadge from './document-priority-badge';
import DocumentTypeChip from './document-type-chip';

// ----------------------------------------------------------------------

export default function DocumentTableRow({ row, selected, onSelectRow, onView, onDelete }) {
  const {
    id,
    original_filename,
    file_size,
    mime_type,
    document_type,
    document_subtype,
    title,
    processing_status,
    priority,
    created_at,
    is_duplicate,
  } = row;

  const confirm = useBoolean();

  const handleDelete = () => {
    onDelete();
    confirm.onFalse();
  };

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              variant="rounded"
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'background.neutral',
              }}
            >
              <Iconify
                icon={
                  mime_type?.includes('pdf')
                    ? 'vscode-icons:file-type-pdf2'
                    : mime_type?.includes('image')
                      ? 'vscode-icons:file-type-image'
                      : mime_type?.includes('word')
                        ? 'vscode-icons:file-type-word'
                        : 'vscode-icons:default-file'
                }
                width={28}
              />
            </Avatar>

            <ListItemText
              disableTypography
              primary={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Typography variant="subtitle2" noWrap>
                    {title || original_filename}
                  </Typography>
                  {is_duplicate && (
                    <Tooltip title="Documento duplicato">
                      <Iconify
                        icon="solar:copy-bold-duotone"
                        width={16}
                        sx={{ color: 'warning.main' }}
                      />
                    </Tooltip>
                  )}
                </Stack>
              }
              secondary={
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {original_filename}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fData(file_size)}
                  </Typography>
                </Stack>
              }
            />
          </Stack>
        </TableCell>

        <TableCell>
          <DocumentTypeChip type={document_type} subtype={document_subtype} />
        </TableCell>

        <TableCell>
          <DocumentStatusChip status={processing_status} />
        </TableCell>

        <TableCell>
          <DocumentPriorityBadge priority={priority} />
        </TableCell>

        <TableCell>
          <Typography variant="body2">{fDate(created_at)}</Typography>
          <Typography variant="caption" color="text.secondary">
            {fDateTime(created_at).split(' ')[1]}
          </Typography>
        </TableCell>

        <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }}>
          <Tooltip title="Visualizza">
            <IconButton onClick={onView}>
              <Iconify icon="solar:eye-bold" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Elimina">
            <IconButton onClick={confirm.onTrue} sx={{ color: 'error.main' }}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina Documento"
        content={`Sei sicuro di voler eliminare il documento "${title || original_filename}"?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Elimina
          </Button>
        }
      />
    </>
  );
}

DocumentTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onView: PropTypes.func,
  onDelete: PropTypes.func,
};
