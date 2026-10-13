import { Link, useLocation, useNavigate } from 'react-router-dom';

/**
 * "← Back" for detail pages. When the user got here from another page of the app it goes back to that exact page
 * (the browser's back, so its table settings and cached data return with it), and the label names it if the
 * link that brought the user here said so: <Link state={{ backLabel: 'Trust Insights' }} />.
 * A page opened directly has nothing to go back to, so it goes to `to` and shows `label`.
 */
function BackLink({ to, label }) {
  const location = useLocation();
  const navigate = useNavigate();

  // `location.key` is 'default' only for the first page of a visit.
  const hasHistory = location.key !== 'default';
  const text = hasHistory ? (location.state?.backLabel ? `Back to ${location.state.backLabel}` : 'Back') : label;

  const goBack = (event) => {
    if (!hasHistory) return;
    event.preventDefault();
    navigate(-1);
  };

  return (
    <Link to={to} onClick={goBack} className="text-sm font-medium text-[#b04a4f] hover:underline">
      ← {text}
    </Link>
  );
}

export default BackLink;
