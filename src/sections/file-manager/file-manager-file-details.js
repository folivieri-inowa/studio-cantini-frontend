import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import FileThumbnail, { fileFormat } from 'src/components/file-thumbnail';

// ----------------------------------------------------------------------

export default function FileManagerFileDetails({
  file,
  open,
  onClose,
  onDelete,
  db,
  ...other
}) {
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (onDelete && !deleteLoading) {
      setDeleteLoading(true);
      try {
        await onDelete(file);
        onClose();
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Determina il formato del file
  const isImage = file && fileFormat(file.url) === 'image';

  // Funzioni di formattazione
  const formatFileSize = (size) => {
    if (!size) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / (1024 ** i)).toFixed(2)} ${units[i]}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(date).toLocaleDateString('it-IT', options);
  };

  const renderInfo = (
    <>
      <Stack spacing={1.5} sx={{ p: 2.5, typography: 'body2' }}>
        <Stack direction="row" alignItems="center">
          <Box component="span" sx={{ color: 'text.secondary', width: 80 }}>
            Nome:
          </Box>
          {file?.name}
        </Stack>

        {file?.modifiedDate && (
          <Stack direction="row" alignItems="center">
            <Box component="span" sx={{ color: 'text.secondary', width: 80 }}>
              Data:
            </Box>
            {formatDate(file.modifiedDate)}
          </Stack>
        )}

        {file?.size && (
          <Stack direction="row" alignItems="center">
            <Box component="span" sx={{ color: 'text.secondary', width: 80 }}>
              Dimensione:
            </Box>
            {formatFileSize(file.size)}
          </Stack>
        )}

        <Stack direction="row" alignItems="center">
          <Box component="span" sx={{ color: 'text.secondary', width: 80 }}>
            Tipo:
          </Box>
          {file?.type || 'Unknown'}
        </Stack>
      </Stack>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );

  const handleDownload = () => {
    if (file?.url) {
      // Crea un elemento link nascosto
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = file.url;
      a.download = file.name || 'download';
      document.body.appendChild(a);
      
      // Trigger click per avviare il download
      a.click();
      
      // Pulizia
      window.URL.revokeObjectURL(a.href);
      document.body.removeChild(a);
    }
  };

  const renderActions = (
    <Stack spacing={2} sx={{ p: 2.5 }}>
      <Button
        fullWidth
        variant="soft"
        color="primary"
        startIcon={<Iconify icon="solar:download-bold" />}
        onClick={handleDownload}
      >
        Scarica
      </Button>

      {onDelete && (
        <Button
          fullWidth
          color="error"
          variant="soft"
          disabled={deleteLoading}
          startIcon={deleteLoading ? <CircularProgress size={24} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={handleDelete}
        >
          {deleteLoading ? 'Eliminazione...' : 'Elimina'}
        </Button>
      )}

      <Button
        fullWidth
        variant="soft"
        color="inherit"
        startIcon={<Iconify icon="solar:close-circle-bold" />}
        onClick={onClose}
      >
        Chiudi
      </Button>
    </Stack>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        backdrop: { invisible: false },
      }}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 480 } },
      }}
      {...other}
    >
      <Scrollbar sx={{ height: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
          <Typography variant="h6">Dettagli File</Typography>
          
          <IconButton onClick={onClose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Stack>

        <Stack
          spacing={2.5}
          justifyContent="center"
          sx={{
            p: 2.5,
            bgcolor: 'background.neutral',
          }}
        >
          {isImage ? (
            <Box 
              sx={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                mb: 2
              }}
            >
              <Box
                component="img"
                src={file?.url}
                alt={file?.name}
                sx={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 320,
                  borderRadius: 1,
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
              />
            </Box>
          ) : (
            <FileThumbnail
              imageView
              file={file?.url || file?.type || 'file'}
              sx={{ width: 140, height: 140, mx: 'auto' }}
              imgSx={{ borderRadius: 1 }}
            />
          )}

          <Link
            color="inherit"
            variant="subtitle1"
            align="center"
            onClick={(e) => {
              if (file?.url) {
                e.preventDefault();
                window.open(file.url);
              }
            }}
            sx={{ cursor: file?.url ? 'pointer' : 'default', wordBreak: 'break-all' }}
          >
            {file?.name}
          </Link>

          <Chip
            variant="soft"
            label={file?.type?.toUpperCase() || 'FILE'}
            sx={{ alignSelf: 'center', textTransform: 'uppercase' }}
          />

          <Divider sx={{ borderStyle: 'dashed' }} />
        </Stack>

        {renderInfo}
      </Scrollbar>

      {renderActions}
    </Drawer>
  );
}

FileManagerFileDetails.propTypes = {
  file: PropTypes.shape({
    name: PropTypes.string,
    size: PropTypes.number,
    type: PropTypes.string,
    url: PropTypes.string,
    modifiedDate: PropTypes.instanceOf(Date),
  }),
  onClose: PropTypes.func,
  onDelete: PropTypes.func,
  open: PropTypes.bool,
  db: PropTypes.string,
};
