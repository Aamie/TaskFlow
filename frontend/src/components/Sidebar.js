import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Icons } from './UI';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Icons.Dashboard },
    { path: '/projects', label: 'Projects', icon: Icons.Folder },
    { path: '/tasks', label: 'Tasks', icon: Icons.CheckSquare },
    ...(user?.role === 'admin' ? [{ path: '/team', label: 'Team', icon: Icons.Users }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">Task<span>Flow</span></div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-link ${pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <item.icon />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-user">
        <Avatar name={user?.name} />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name}</div>
          <div className="sidebar-user-role">{user?.role}</div>
        </div>
        <button className="btn btn-ghost btn-xs" onClick={handleLogout} title="Sign out">
          <Icons.LogOut />
        </button>
      </div>
    </div>
  );
}
