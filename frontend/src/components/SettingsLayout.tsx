import { useState } from 'react';
import { UserProfile } from './UserProfile';
import { TokenManager } from './TokenManager';
import { GroupManager } from './GroupManager';

type SettingsSection = 'profile' | 'tokens' | 'teams';

export function SettingsLayout() {
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    return (
        <div className="settings-layout">
            <div className="settings-sidebar">
                <h2 className="settings-sidebar-title">Settings</h2>

                <nav className="settings-nav">
                    <button
                        className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveSection('profile')}
                    >
                        <span className="settings-nav-icon">👤</span>
                        Profile
                    </button>

                    <button
                        className={`settings-nav-item ${activeSection === 'tokens' ? 'active' : ''}`}
                        onClick={() => setActiveSection('tokens')}
                    >
                        <span className="settings-nav-icon">🔑</span>
                        Access Tokens
                    </button>

                    <button
                        className={`settings-nav-item ${activeSection === 'teams' ? 'active' : ''}`}
                        onClick={() => setActiveSection('teams')}
                    >
                        <span className="settings-nav-icon">👥</span>
                        Teams
                    </button>
                </nav>
            </div>

            <div className="settings-content">
                {activeSection === 'profile' && <UserProfile />}
                {activeSection === 'tokens' && <TokenManager />}
                {activeSection === 'teams' && <GroupManager />}
            </div>
        </div>
    );
}
