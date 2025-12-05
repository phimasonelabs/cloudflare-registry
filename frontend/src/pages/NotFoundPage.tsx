import { Link } from 'react-router-dom'

export function NotFoundPage() {
    return (
        <div className="not-found-page">
            <div className="not-found-content">
                <div className="not-found-icon">🔍</div>
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page Not Found</h2>
                <p className="not-found-description">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="not-found-actions">
                    <Link to="/" className="btn-primary">
                        <span>🏠</span> Go Home
                    </Link>
                    <Link to="/browse" className="btn-secondary">
                        <span>📦</span> Browse Images
                    </Link>
                </div>
            </div>
        </div>
    )
}
