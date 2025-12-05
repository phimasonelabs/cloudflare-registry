import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { CopyButton } from '../components/CopyButton'

interface Repository {
    name: string;
    tags: string[];
    is_public: boolean;
}

export function BrowsePage() {
    const { isAuthenticated, login } = useAuth()
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadRepositories()
    }, [isAuthenticated])

    useEffect(() => {
        if (searchQuery) {
            setFilteredRepos(
                repositories.filter(repo =>
                    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    repo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
                )
            )
        } else {
            setFilteredRepos(repositories)
        }
    }, [searchQuery, repositories])

    const loadRepositories = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/repositories')
            if (!res.ok) throw new Error('Failed to fetch repositories')
            const data = await res.json()
            setRepositories(data)
            setFilteredRepos(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load repositories')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="browse-section">
            <div className="browse-header">
                <h1>Container Images</h1>
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search repositories or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button className="clear-btn" onClick={() => setSearchQuery('')}>
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading repositories...</p>
                </div>
            )}

            {!loading && filteredRepos.length === 0 && !error && (
                <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No repositories yet</h3>
                    <p>Push your first container image to get started</p>

                    {/* Demo repositories section */}
                    <div className="demo-section">
                        <h4>📚 Example Repositories</h4>
                        <p className="demo-hint">Here are some popular images you can try:</p>
                        <div className="demo-repos">
                            <div className="demo-repo-card">
                                <div className="demo-repo-icon">🐧</div>
                                <h5>alpine</h5>
                                <p>Lightweight Linux distribution</p>
                                <div className="demo-tag">latest • 7.8MB</div>
                            </div>
                            <div className="demo-repo-card">
                                <div className="demo-repo-icon">🌊</div>
                                <h5>nginx</h5>
                                <p>High-performance web server</p>
                                <div className="demo-tag">latest • 142MB</div>
                            </div>
                            <div className="demo-repo-card">
                                <div className="demo-repo-icon">🐹</div>
                                <h5>golang</h5>
                                <p>Go programming language</p>
                                <div className="demo-tag">latest • 814MB</div>
                            </div>
                            <div className="demo-repo-card">
                                <div className="demo-repo-icon">🐳</div>
                                <h5>node</h5>
                                <p>JavaScript runtime environment</p>
                                <div className="demo-tag">lts-alpine • 123MB</div>
                            </div>
                        </div>
                        <div className="demo-actions">
                            <code className="demo-command">docker pull {window.location.host}/alpine:latest</code>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                    {!isAuthenticated && (
                        <button onClick={login} className="retry-button">
                            Sign In to View
                        </button>
                    )}
                    {isAuthenticated && (
                        <button onClick={loadRepositories} className="retry-button">
                            Retry
                        </button>
                    )}
                </div>
            )}

            {!loading && !error && filteredRepos.length === 0 && (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>{searchQuery ? 'No matching repositories' : 'No repositories found'}</h3>
                    <p>{searchQuery ? 'Try a different search term' : 'Push your first image to get started!'}</p>
                </div>
            )}

            {!loading && !error && filteredRepos.length > 0 && (
                <div className="repos-grid">
                    {filteredRepos.map(repo => (
                        <div key={repo.name} className="repo-card">
                            <div className="repo-card-header">
                                <div className="repo-name">
                                    <span className="repo-icon">📦</span>
                                    <span>{repo.name}</span>
                                    {repo.is_public && <span className="public-badge">Public</span>}
                                </div>
                                <span className="tag-count-badge">{repo.tags.length}</span>
                            </div>
                            <div className="repo-tags">
                                {repo.tags.map(tag => (
                                    <span key={tag} className="tag">{tag}</span>
                                ))}
                            </div>
                            <div className="repo-actions">
                                <div className="pull-cmd">
                                    <code>docker pull {window.location.host}/{repo.name}:{repo.tags[0]}</code>
                                    <CopyButton
                                        text={`docker pull ${window.location.host}/${repo.name}:${repo.tags[0]}`}
                                        className="copy-btn-small"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
