import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import { useBoolean } from 'src/hooks/use-boolean';
import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fData } from 'src/utils/format-number';
import { useSnackbar } from 'src/components/snackbar';
import FileManagerFileDetails from './file-manager-file-details';
import FileManagerSubfolderItem from './file-manager-subfolder-item';

// ----------------------------------------------------------------------

export default function FileManagerFolderItem({
  folder,
  sx,
  ...other
}) {

  const details = useBoolean();

  const renderIcon = <Box onClick={details.onTrue} component="img" src="/assets/icons/files/ic_folder.svg" sx={{ width: 36, height: 36 }} />

  const renderText = (
    <ListItemText
      onClick={details.onTrue}
      primary={folder.name}
      secondary={
        <>
          {fData(folder.size)}
          <Box
            component="span"
            sx={{
              mx: 0.75,
              width: 2,
              height: 2,
              borderRadius: '50%',
              bgcolor: 'currentColor',
            }}
          />
          {folder.subfolderCount} cartelle
        </>
      }
      slotProps={{
        primary: {
          noWrap: true,
          typography: 'subtitle1',
        },
        secondary: {
          mt: 0.5,
          component: 'span',
          alignItems: 'center',
          typography: 'caption',
          color: 'text.disabled',
          display: 'inline-flex',
        }
      }}
    />
  );

  return (
    <>
      <Stack
        component={Paper}
        variant="outlined"
        spacing={1}
        alignItems="flex-start"
        sx={{
          p: 2.5,
          maxWidth: 222,
          borderRadius: 2,
          bgcolor: 'unset',
          cursor: 'pointer',
          position: 'relative',
          ...sx,
        }}
        {...other}
      >
        <Box>
          {renderIcon}
        </Box>

        {renderText}
      </Stack>

      <FileManagerSubfolderItem
        folder={folder}
        open={details.value}
        onClose={details.onFalse}
      />

      {/* <FileManagerFileDetails
        item={folder}
        open={details.value}
        onClose={details.onFalse}
      /> */}
    </>
  );
}

FileManagerFolderItem.propTypes = {
  folder: PropTypes.object,
  sx: PropTypes.object,
};
