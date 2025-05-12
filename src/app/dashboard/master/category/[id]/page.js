import PropTypes from 'prop-types';

import CategoryDetailsView from '../../../../../sections/overview/category/view/category-details-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: Dettaglio Categoria',
};

export default async function CategoryDetailPage({ params }) {
  const { id } = params;

  return <CategoryDetailsView categoryId={id} />;
}

CategoryDetailPage.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string
  }),
};
