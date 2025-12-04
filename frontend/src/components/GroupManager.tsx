import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Group, GroupMember } from '../types';

export function GroupManager() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [newMemberId, setNewMemberId] = useState('');

    useEffect(() => {
        loadGroups();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            loadMembers(selectedGroup.id);
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/groups');
            if (!res.ok) throw new Error('Failed to load groups');
            const data = await res.json();
            setGroups(data);
        } catch (err) {
            setError('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

    const loadMembers = async (groupId: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}`);
            if (!res.ok) throw new Error('Failed to load members');
            const data = await res.json();
            setMembers(data.members || []);
        } catch (err) {
            console.error(err);
        }
    };

    const createGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGroupName, description: newGroupDesc }),
            });
            if (!res.ok) throw new Error('Failed to create group');

            await loadGroups();
            setShowCreateModal(false);
            setNewGroupName('');
            setNewGroupDesc('');
        } catch (err) {
            setError('Failed to create group');
        }
    };

    const addMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        try {
            const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newMemberId, role: 'member' }),
            });
            if (!res.ok) throw new Error('Failed to add member');

            await loadMembers(selectedGroup.id);
            setNewMemberId('');
        } catch (err) {
            setError('Failed to add member');
        }
    };

    const removeMember = async (userId: string) => {
        if (!selectedGroup) return;
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            const res = await fetch(`/api/groups/${selectedGroup.id}/members/${userId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove member');

            await loadMembers(selectedGroup.id);
        } catch (err) {
            setError('Failed to remove member');
        }
    };

    const deleteGroup = async (groupId: string) => {
        if (!confirm('Are you sure you want to delete this group? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete group');

            if (selectedGroup?.id === groupId) setSelectedGroup(null);
            await loadGroups();
        } catch (err) {
            setError('Failed to delete group');
        }
    };

    if (loading && !groups.length) return <div className="loading-state">Loading groups...</div>;

    return (
        <div className="group-manager">
            {error && (
                <div className="error-toast" onClick={() => setError(null)}>
                    {error}
                    <span className="close-toast">×</span>
                </div>
            )}
            <div className="group-sidebar">
                <div className="sidebar-header">
                    <h2>My Teams</h2>
                    <button className="create-btn" onClick={() => setShowCreateModal(true)}>+</button>
                </div>
                <div className="group-list">
                    {groups.map(group => (
                        <div
                            key={group.id}
                            className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                            onClick={() => setSelectedGroup(group)}
                        >
                            <span className="group-icon">👥</span>
                            <div className="group-info">
                                <span className="group-name">{group.name}</span>
                                <span className="group-role">
                                    {group.created_by === user?.id ? 'Owner' : 'Member'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="group-content">
                {selectedGroup ? (
                    <>
                        <div className="content-header">
                            <div>
                                <h1>{selectedGroup.name}</h1>
                                <p>{selectedGroup.description || 'No description'}</p>
                            </div>
                            {selectedGroup.created_by === user?.id && (
                                <button
                                    className="delete-btn"
                                    onClick={() => deleteGroup(selectedGroup.id)}
                                >
                                    Delete Group
                                </button>
                            )}
                        </div>

                        <div className="members-section">
                            <h3>Members ({members.length})</h3>

                            <div className="members-list">
                                {members.map(member => (
                                    <div key={member.id} className="member-item">
                                        <div className="member-info">
                                            <img
                                                src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.email)}`}
                                                alt={member.full_name || ''}
                                                className="member-avatar"
                                            />
                                            <div>
                                                <div className="member-name">{member.full_name || member.email}</div>
                                                <div className="member-email">{member.email}</div>
                                            </div>
                                        </div>
                                        <div className="member-role">{member.role}</div>
                                        {selectedGroup.created_by === user?.id && member.user_id !== user?.id && (
                                            <button
                                                className="remove-btn"
                                                onClick={() => removeMember(member.user_id)}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {selectedGroup.created_by === user?.id && (
                                <form onSubmit={addMember} className="add-member-form">
                                    <input
                                        type="text"
                                        placeholder="User ID to add..."
                                        value={newMemberId}
                                        onChange={e => setNewMemberId(e.target.value)}
                                        className="input-field"
                                    />
                                    <button type="submit" className="action-btn">Add Member</button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="empty-selection">
                        <span className="empty-icon">👈</span>
                        <p>Select a group to manage members</p>
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
                        <h2>Create New Team</h2>
                        <form onSubmit={createGroup}>
                            <div className="form-group">
                                <label>Team Name</label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    required
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={newGroupDesc}
                                    onChange={e => setNewGroupDesc(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <button type="submit" className="submit-btn">Create Team</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
