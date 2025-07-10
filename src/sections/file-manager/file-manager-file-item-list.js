import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import FileManagerFileItem from './file-manager-file-item';

// ----------------------------------------------------------------------

export default function FileManagerFileItemList({
  files,
  open,
  //
  onClose,
  ...other
}) {

  const { name, type, subfolder } = files;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor="right"
      slotProps={{
        backdrop: { invisible: false },
      }}
      PaperProps={{
        sx: { width: '90%' },
      }}
      {...other}
    >
      <Scrollbar sx={{ height: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
          <Typography variant="h6"> Files </Typography>
        </Stack>

        <Stack
          spacing={2.5}
          justifyContent="center"
          sx={{
            p: 2.5,
            bgcolor: 'background.neutral',
          }}
        >
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            }}
            gap={3}
          >
            {files
              .map((file) => (
                <FileManagerFileItem
                  key={file.etag}
                  file={file}
                  sx={{ maxWidth: 'auto' }}
                />
              ))}
          </Box>
        </Stack>
      </Scrollbar>

      <Box sx={{ p: 2.5 }}>
        <Button
          fullWidth
          variant="soft"
          color="error"
          size="large"
          startIcon={<Iconify icon="solar:close-circle-bold" />}
          onClick={onClose}
        >
          Chiudi
        </Button>
      </Box>
    </Drawer>
  );
}

FileManagerFileItemList.propTypes = {
  files: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
