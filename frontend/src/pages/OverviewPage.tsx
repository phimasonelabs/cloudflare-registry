import { CopyButton } from '../components/CopyButton'

export function OverviewPage() {
    return (
        <div className="overview-section">
            <div className="hero-card">
                <h1 className="hero-title">
                    <span className="hero-icon">🐳</span>
                    Welcome to Container Registry
                </h1>
                <p className="hero-subtitle">
                    A fully-featured Docker Registry v2 running on Cloudflare Workers
                </p>
                <div className="hero-features">
                    <div className="feature-item">
                        <span className="feature-icon">🔐</span>
                        <span>OAuth Authentication</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">👥</span>
                        <span>Team Management</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🎫</span>
                        <span>Personal Access Tokens</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🌍</span>
                        <span>Serverless & Scalable</span>
                    </div>
                </div>
            </div>

            <div className="quick-start-card">
                <h2>🚀 Quick Start</h2>
                <p>Get started with your container registry in 3 simple steps:</p>
                <div className="commands-list">
                    <div className="command-item">
                        <div className="command-label">1. Login to Registry</div>
                        <div className="cmd-block">
                            <code>docker login {window.location.host}</code>
                            <CopyButton text={`docker login ${window.location.host}`} className="copy-btn-small" />
                        </div>
                        <p className="hint-text">Use your OAuth token as the password</p>
                    </div>
                    <div className="command-item">
                        <div className="command-label">2. Tag your image</div>
                        <div className="cmd-block">
                            <code>docker tag myimage:latest {window.location.host}/myimage:latest</code>
                            <CopyButton text={`docker tag myimage:latest ${window.location.host}/myimage:latest`} className="copy-btn-small" />
                        </div>
                    </div>
                    <div className="command-item">
                        <div className="command-label">3. Push to registry</div>
                        <div className="cmd-block">
                            <code>docker push {window.location.host}/myimage:latest</code>
                            <CopyButton text={`docker push ${window.location.host}/myimage:latest`} className="copy-btn-small" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
