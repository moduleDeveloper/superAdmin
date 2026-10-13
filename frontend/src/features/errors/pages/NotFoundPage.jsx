import { Link } from 'react-router-dom';

import { getToken } from '../../auth/services/authService';
import ErrorLayout, { primaryButton } from '../components/ErrorLayout';

function NotFoundPage() {
  const loggedIn = Boolean(getToken());

  return (
    <ErrorLayout
      code="404"
      title="Page not found"
      message="The page you are looking for doesn't exist or has been moved."
    >
      <Link to={loggedIn ? '/' : '/login'} className={primaryButton}>
        {loggedIn ? 'Back to Dashboard' : 'Go to Login'}
      </Link>
    </ErrorLayout>
  );
}

export default NotFoundPage;
