import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';

export function UserProfile() {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <div className="user-profile">
            <div className="profile-header">
                <h1>Profile</h1>
            </div>

            <div className="profile-card">
                <div className="profile-avatar-section">
                    <UserAvatar
                        src={user.avatar}
                        email={user.email}
                        name={user.name}
                        size="large"
                    />
                </div>

                <div className="profile-info-section">
                    <div className="profile-field">
                        <label>Name</label>
                        <div className="profile-value">{user.name || 'Not set'}</div>
                    </div>

                    <div className="profile-field">
                        <label>Email</label>
                        <div className="profile-value">{user.email}</div>
                    </div>

                    <div className="profile-field">
                        <label>User ID</label>
                        <div className="profile-value">
                            <code className="user-id-code">{user.id}</code>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-actions">
                <button className="btn-danger" onClick={logout}>
                    Sign Out
                </button>
            </div>
        </div>
    );
}
