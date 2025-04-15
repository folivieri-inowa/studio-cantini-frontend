import { JwtLoginView } from 'src/sections/auth/jwt';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Studio Cantini: Login'
};

export default function LoginPage() {
  return <JwtLoginView />;
}
