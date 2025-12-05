import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserAvatar } from './UserAvatar';

export function UserMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button className="user-menu-trigger" onClick={() => setIsOpen(!isOpen)}>
                <UserAvatar
                    src={user.avatar}
                    email={user.email}
                    name={user.name}
                    size="small"
                />
                <span className="user-name">{user.name || user.email.split('@')[0]}</span>
                <span className="dropdown-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="user-dropdown">
                    <div className="dropdown-header">
                        <p className="dropdown-user-name">{user.name}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item" onClick={() => handleNavigate('/browse')}>
                        <span className="item-icon">📦</span>
                        My Repositories
                    </button>

                    <button className="dropdown-item" onClick={() => handleNavigate('/settings')}>
                        <span className="item-icon">⚙️</span>
                        Settings
                    </button>

                    <div className="dropdown-divider"></div>

                    <button className="dropdown-item logout" onClick={() => logout()}>
                        <span className="item-icon">🚪</span>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
