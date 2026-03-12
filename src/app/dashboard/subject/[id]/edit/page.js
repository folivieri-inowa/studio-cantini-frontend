import PropTypes from 'prop-types';

import { _userList } from 'src/_mock/_user';

import SubjectEditView from '../../../../../sections/subject/view/subject-edit-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: User Edit'
};

export default function SubjectEditPage({ params }) {
  const { id } = params;

  return <SubjectEditView id={id} />;
}

export async function generateStaticParams() {
  return _userList.map((user) => ({
    id: user.id,
  }));
}

SubjectEditPage.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
  }),
};
