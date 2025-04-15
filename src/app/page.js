import { redirect } from 'next/navigation';

import { PATH_AFTER_LOGIN } from '../config-global';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Minimal: The starting point for your next project'
};

export default function HomePage() {
  redirect(PATH_AFTER_LOGIN);
}
