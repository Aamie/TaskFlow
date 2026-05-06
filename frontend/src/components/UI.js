import React from 'react';

export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date();
}

export function Avatar({ name, size = '' }) {
  return (
    <div className={`avatar ${size ? 'avatar-' + size : ''}`} title={name}>
      {initials(name)}
    </div>
  );
}

export function Badge({ type, children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const labels = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
  return <Badge type={status}>{labels[status] || status}</Badge>;
}

export function PriorityBadge({ priority }) {
  return <Badge type={priority}>{priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Medium'}</Badge>;
}

export function RoleBadge({ role }) {
  return <Badge type={role}>{role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member'}</Badge>;
}

export function ProjectStatusBadge({ status }) {
  return <Badge type={status}>{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Active'}</Badge>;
}

export function ProgressBar({ value, max, color = '' }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" style={{ marginTop: 6 }}>
      <div className={`progress-bar ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Alert({ type = 'error', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Loading() {
  return <div className="loading">Loading...</div>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function FormGroup({ label, children, error }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}

// SVG Icons
export const Icons = {
  Dashboard: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  ),
  Folder: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1.5 4.5a1 1 0 011-1h3.5l1.5 1.5H13a1 1 0 011 1v6a1 1 0 01-1 1H2.5a1 1 0 01-1-1V4.5z" />
    </svg>
  ),
  CheckSquare: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" />
      <path d="M4.5 8l2.5 2.5 4.5-5" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1 13.5c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="12.5" cy="5" r="2" />
      <path d="M15.5 13c0-2.1-1.3-3.9-3-4.5" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2v12M2 8h12" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 4h12M5 4V2.5h6V4M6 7v5M10 7v5M3 4l1 9.5h8L13 4" />
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10.5 11l3.5-3-3.5-3M14 8H6" />
    </svg>
  ),
};
