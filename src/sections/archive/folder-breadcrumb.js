import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function FolderBreadcrumb({ breadcrumb, onNavigate }) {
  const handleClick = (event, path) => {
    event.preventDefault();
    onNavigate(path);
  };

  return (
    <Breadcrumbs
      separator={<Iconify icon="eva:chevron-right-fill" width={16} />}
      sx={{ mb: 2 }}
    >
      {breadcrumb.map((item, index) => {
        const isLast = index === breadcrumb.length - 1;

        return isLast ? (
          <Typography
            key={item.path}
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {index === 0 ? (
              <Iconify icon="eva:home-fill" width={18} />
            ) : (
              <Iconify icon="eva:folder-fill" width={18} />
            )}
            {item.name}
          </Typography>
        ) : (
          <Link
            key={item.path}
            href="#"
            onClick={(e) => handleClick(e, item.path)}
            underline="hover"
            color="inherit"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              '&:hover': { color: 'primary.main' },
            }}
          >
            {index === 0 ? (
              <Iconify icon="eva:home-fill" width={18} />
            ) : (
              <Iconify icon="eva:folder-fill" width={18} />
            )}
            {item.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}

FolderBreadcrumb.propTypes = {
  breadcrumb: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ).isRequired,
  onNavigate: PropTypes.func.isRequired,
};
