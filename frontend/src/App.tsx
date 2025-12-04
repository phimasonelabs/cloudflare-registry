import { useState, useEffect } from 'react'
import './App.css'

interface Repository {
    name: string;
    tags: string[];
}

function App() {
    const [activeTab, setActiveTab] = useState<'overview' | 'quickstart' | 'browse'>('overview')
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (activeTab === 'browse') {
            loadRepositories()
        }
    }, [activeTab])

    const loadRepositories = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/repositories')
            if (!res.ok) throw new Error('Failed to fetch repositories')
            const data = await res.json()
            setRepositories(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load repositories')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <header className="header">
                <div className="header-content">
                    <h1>🐳 Container Registry</h1>
                    <p className="subtitle">OCI-compatible registry on Cloudflare Edge</p>
                </div>
            </header>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'quickstart' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quickstart')}
                >
                    Quick Start
                </button>
                <button
                    className={`tab ${activeTab === 'browse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse')}
                >
                    📦 Browse
                </button>
            </div>

            <main className="content">
                {activeTab === 'overview' && (
                    <div className="tab-content">
                        <section className="card">
                            <h2>📦 About This Registry</h2>
                            <p>
                                A high-performance container registry running on <strong>Cloudflare Workers</strong> at the edge,
                                with blob storage in <strong>Cloudflare R2</strong>. Built with Bun, Hono, and TypeScript.
                            </p>
                            <div className="features">
                                <div className="feature">
                                    <span className="feature-icon">⚡</span>
                                    <div>
                                        <h3>Edge Performance</h3>
                                        <p>Global distribution via Cloudflare's CDN</p>
                                    </div>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">🔒</span>
                                    <div>
                                        <h3>OCI Compatible</h3>
                                        <p>Works with Docker, Podman, and more</p>
                                    </div>
                                </div>
                                <div className="feature">
                                    <span className="feature-icon">💰</span>
                                    <div>
                                        <h3>Cost Effective</h3>
                                        <p>R2 storage with no egress fees</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="card">
                            <h2>🔧 Tech Stack</h2>
                            <div className="tech-stack">
                                <span className="badge">Bun</span>
                                <span className="badge">Hono</span>
                                <span className="badge">TypeScript</span>
                                <span className="badge">Cloudflare Workers</span>
                                <span className="badge">R2 Storage</span>
                                <span className="badge">React</span>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'quickstart' && (
                    <div className="tab-content">
                        <section className="card">
                            <h2>🚀 Quick Start</h2>

                            <div className="step">
                                <h3>1. Tag your image</h3>
                                <pre><code>docker tag alpine:latest {window.location.host}/alpine:latest</code></pre>
                            </div>

                            <div className="step">
                                <h3>2. Push to registry</h3>
                                <pre><code>docker push {window.location.host}/alpine:latest</code></pre>
                            </div>

                            <div className="step">
                                <h3>3. Pull from registry</h3>
                                <pre><code>docker pull {window.location.host}/alpine:latest</code></pre>
                            </div>
                        </section>

                        <section className="card">
                            <h2>📚 API Endpoints</h2>
                            <table className="endpoints-table">
                                <thead>
                                    <tr>
                                        <th>Method</th>
                                        <th>Path</th>
                                        <th>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>GET</code></td>
                                        <td><code>/v2/</code></td>
                                        <td>API version check</td>
                                    </tr>
                                    <tr>
                                        <td><code>GET</code></td>
                                        <td><code>/v2/&lt;name&gt;/blobs/&lt;digest&gt;</code></td>
                                        <td>Pull blob</td>
                                    </tr>
                                    <tr>
                                        <td><code>POST</code></td>
                                        <td><code>/v2/&lt;name&gt;/blobs/uploads/</code></td>
                                        <td>Initiate upload</td>
                                    </tr>
                                    <tr>
                                        <td><code>GET</code></td>
                                        <td><code>/v2/&lt;name&gt;/manifests/&lt;ref&gt;</code></td>
                                        <td>Pull manifest</td>
                                    </tr>
                                    <tr>
                                        <td><code>PUT</code></td>
                                        <td><code>/v2/&lt;name&gt;/manifests/&lt;ref&gt;</code></td>
                                        <td>Push manifest</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>
                    </div>
                )}

                {activeTab === 'browse' && (
                    <div className="tab-content">
                        <section className="card">
                            <h2>📦 Browse Repositories</h2>

                            {loading && (
                                <div className="loading">
                                    <div className="spinner"></div>
                                    <p>Loading repositories...</p>
                                </div>
                            )}

                            {error && (
                                <div className="error">
                                    <p>❌ {error}</p>
                                    <button onClick={loadRepositories} className="retry-btn">Retry</button>
                                </div>
                            )}

                            {!loading && !error && repositories.length === 0 && (
                                <div className="empty-state">
                                    <p>📭 No repositories found</p>
                                    <p className="hint">Push an image to get started!</p>
                                </div>
                            )}

                            {!loading && !error && repositories.length > 0 && (
                                <div className="repositories-list">
                                    {repositories.map(repo => (
                                        <div key={repo.name} className="repository-card">
                                            <div className="repo-header">
                                                <h3>🐳 {repo.name}</h3>
                                                <span className="tag-count">{repo.tags.length} tag{repo.tags.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            <div className="tags-list">
                                                {repo.tags.map(tag => (
                                                    <span key={tag} className="tag-badge">{tag}</span>
                                                ))}
                                            </div>
                                            <div className="repo-actions">
                                                <code className="pull-command">
                                                    docker pull {window.location.host}/{repo.name}:{repo.tags[0]}
                                                </code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </main>

            <footer className="footer">
                <p>Powered by Cloudflare Workers • Built with ❤️ using Bun + Hono + React</p>
            </footer>
        </div>
    )
}

export default App
