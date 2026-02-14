import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { fData } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function FileListView({ folders, files, onFolderClick, onFileClick }) {
  return (
    <Box>
      {/* Cartelle */}
      {folders.map((folder) => (
        <ListItem key={folder.folder_name} disablePadding>
          <ListItemButton onClick={() => onFolderClick(folder)}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                mr: 2,
                bgcolor: 'primary.lighter',
                color: 'primary.main',
              }}
            >
              <Iconify icon="eva:folder-fill" width={24} />
            </Avatar>
            <ListItemText
              primary={folder.folder_name}
              secondary={`${folder.file_count} ${folder.file_count === 1 ? 'elemento' : 'elementi'}`}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </ListItem>
      ))}

      {/* File */}
      {files.map((file) => (
        <ListItem key={file.id} disablePadding>
          <ListItemButton onClick={() => onFileClick(file)}>
            {renderFileIcon(file)}
            <ListItemText
              primary={file.original_filename}
              secondary={
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {fData(file.file_size)}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    •
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fDateTime(file.created_at)}
                  </Typography>
                  {file.tags && file.tags.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.disabled">
                        •
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {file.tags.slice(0, 3).map((tag) => (
                          <Box
                            key={tag}
                            sx={{
                              px: 0.75,
                              py: 0.25,
                              borderRadius: 0.5,
                              bgcolor: 'action.hover',
                              fontSize: 10,
                            }}
                          >
                            {tag}
                          </Box>
                        ))}
                        {file.tags.length > 3 && (
                          <Typography variant="caption" color="text.disabled">
                            +{file.tags.length - 3}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Stack>
              }
              primaryTypographyProps={{ variant: 'subtitle2', noWrap: true }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </Box>
  );
}

FileListView.propTypes = {
  folders: PropTypes.array,
  files: PropTypes.array,
  onFolderClick: PropTypes.func.isRequired,
  onFileClick: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function renderFileIcon(file) {
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
        width: 40,
        height: 40,
        mr: 2,
        bgcolor: `${color}.lighter`,
        color: `${color}.main`,
      }}
    >
      <Iconify icon={icon} width={20} />
    </Avatar>
  );
}
