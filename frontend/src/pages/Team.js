import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getUsers, updateUserRole, deleteUser } from '../api';
import { Avatar, RoleBadge, Loading, EmptyState, Alert, Icons } from '../components/UI';
import { useAuth } from '../context/AuthContext';

export default function Team() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getUsers()
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to load team members.'))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'member' : 'admin';
    if (!window.confirm(`Change ${u.name}'s role to ${newRole}?`)) return;
    try {
      const res = await updateUserRole(u.id, newRole);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: res.data.role } : x));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role.');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Remove ${u.name} from the team? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove user.');
    }
  };

  return (
    <Layout title="Team">
      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <EmptyState title="No team members" description="Users will appear here once they sign up." />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                          {u.id === currentUser.id && (
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>You</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ color: 'var(--text2)', fontSize: 12 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {u.id !== currentUser.id && (
                        <div className="table-actions">
                          <button
                            className="btn btn-xs"
                            onClick={() => handleToggleRole(u)}
                            title={u.role === 'admin' ? 'Demote to Member' : 'Promote to Admin'}
                          >
                            {u.role === 'admin' ? 'Make Member' : 'Make Admin'}
                          </button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => handleDelete(u)}
                            title="Remove user"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
