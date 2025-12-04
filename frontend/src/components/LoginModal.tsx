import { useAuth } from '../context/AuthContext';

export function LoginModal() {
    const { showLoginModal, setShowLoginModal } = useAuth();

    if (!showLoginModal) return null;

    return (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={() => setShowLoginModal(false)}>×</button>

                <div className="modal-header">
                    <h2>Sign In</h2>
                    <p>Access your private repositories and manage permissions</p>
                </div>

                <div className="auth-buttons">
                    <a href="/auth/google" className="auth-btn google">
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="auth-icon" />
                        Continue with Google
                    </a>

                    <a href="/auth/github" className="auth-btn github">
                        <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="auth-icon" />
                        Continue with GitHub
                    </a>
                </div>

                <div className="modal-footer">
                    <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                </div>
            </div>
        </div>
    );
}
