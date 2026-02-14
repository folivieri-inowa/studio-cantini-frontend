import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { fData } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function FileGridView({ folders, files, onFolderClick, onFileClick }) {
  return (
    <Grid container spacing={2}>
      {/* Cartelle */}
      {folders.map((folder) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={folder.folder_name}>
          <Card
            sx={{
              '&:hover': {
                boxShadow: (theme) => theme.customShadows.z8,
              },
            }}
          >
            <CardActionArea onClick={() => onFolderClick(folder)}>
              <Stack spacing={1} sx={{ p: 2, alignItems: 'center' }}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main',
                  }}
                >
                  <Iconify icon="eva:folder-fill" width={40} />
                </Avatar>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ width: '100%', textAlign: 'center' }}
                  title={folder.folder_name}
                >
                  {folder.folder_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {folder.file_count} {folder.file_count === 1 ? 'elemento' : 'elementi'}
                </Typography>
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>
      ))}

      {/* File */}
      {files.map((file) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={file.id}>
          <Card
            sx={{
              '&:hover': {
                boxShadow: (theme) => theme.customShadows.z8,
              },
            }}
          >
            <CardActionArea onClick={() => onFileClick(file)}>
              <Stack spacing={1} sx={{ p: 2, alignItems: 'center' }}>
                {renderFileThumbnail(file)}
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ width: '100%', textAlign: 'center' }}
                  title={file.original_filename}
                >
                  {file.original_filename}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {fData(file.file_size)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fDate(file.created_at)}
                  </Typography>
                </Stack>
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

FileGridView.propTypes = {
  folders: PropTypes.array,
  files: PropTypes.array,
  onFolderClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function renderFileThumbnail(file) {
  const { mime_type, original_filename } = file;

  // Determina icona in base al tipo di file
  let icon = 'eva:file-text-fill';
  let color = 'default';

  if (mime_type?.startsWith('image/')) {
    icon = 'eva:image-fill';
    color = 'info';
  } else if (mime_type?.startsWith('video/')) {
    icon = 'eva:video-fill';
    color = 'error';
  } else if (mime_type === 'application/pdf') {
    icon = 'eva:file-text-fill';
    color = 'error';
  } else if (
    mime_type?.includes('spreadsheet') ||
    mime_type?.includes('excel') ||
    original_filename?.endsWith('.xlsx') ||
    original_filename?.endsWith('.xls')
  ) {
    icon = 'eva:file-text-fill';
    color = 'success';
  } else if (
    mime_type?.includes('document') ||
    mime_type?.includes('word') ||
    original_filename?.endsWith('.docx') ||
    original_filename?.endsWith('.doc')
  ) {
    icon = 'eva:file-text-fill';
    color = 'info';
  } else if (mime_type?.includes('zip') || mime_type?.includes('compressed')) {
    icon = 'eva:archive-fill';
    color = 'warning';
  }

  return (
    <Avatar
      sx={{
        width: 64,
        height: 64,
        bgcolor: `${color}.lighter`,
        color: `${color}.main`,
      }}
    >
      <Iconify icon={icon} width={32} />
    </Avatar>
  );
}
