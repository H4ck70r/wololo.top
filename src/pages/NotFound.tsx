import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <Helmet>
        <title>404 - wololo.top</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <p className="text-8xl font-bold text-gold-400 m-0 mb-2">404</p>
      <h1 className="text-2xl font-bold text-gray-200 m-0 mb-3">Page Not Found</h1>
      <p className="text-gray-500 mb-8 m-0">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 bg-gold-400/20 text-gold-400 border border-gold-400/30 rounded-lg text-sm font-medium hover:bg-gold-400/30 transition-colors no-underline"
        >
          Go Home
        </Link>
        <Link
          to="/leaderboard"
          className="px-5 py-2.5 bg-dark-600 text-gray-300 border border-dark-400 rounded-lg text-sm font-medium hover:bg-dark-500 transition-colors no-underline"
        >
          Leaderboard
        </Link>
      </div>
    </div>
  );
}
