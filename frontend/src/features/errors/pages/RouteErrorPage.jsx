import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import ErrorLayout, { primaryButton, secondaryButton } from '../components/ErrorLayout';

// Thrown after a deploy, when an open tab asks for a chunk that no longer exists.
const isChunkError = (error) =>
  /dynamically imported module|Importing a module script failed|Loading chunk/i.test(
    error?.message ?? ''
  );

function RouteErrorPage() {
  const error = useRouteError();
  const reload = () => window.location.reload();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorLayout
        code="404"
        title="Page not found"
        message="The page you are looking for doesn't exist or has been moved."
      >
        <Link to="/" className={primaryButton}>Back to Dashboard</Link>
      </ErrorLayout>
    );
  }

  if (isChunkError(error)) {
    return (
      <ErrorLayout
        code="Update"
        title="A new version is available"
        message="The app was updated while this tab was open. Reload to continue."
      >
        <button type="button" onClick={reload} className={primaryButton}>Reload</button>
      </ErrorLayout>
    );
  }

  return (
    <ErrorLayout
      code={isRouteErrorResponse(error) ? error.status : '500'}
      title="Something went wrong"
      message={
        import.meta.env.DEV && error?.message
          ? error.message
          : 'An unexpected error occurred. Please try again.'
      }
    >
      <button type="button" onClick={reload} className={primaryButton}>Try again</button>
      <Link to="/" className={secondaryButton}>Back to Dashboard</Link>
    </ErrorLayout>
  );
}

export default RouteErrorPage;
