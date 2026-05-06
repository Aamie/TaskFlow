import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getProjects, createProject, updateProject, deleteProject, getMembers, addProjectMember, removeProjectMember } from '../api';
import { Modal, Alert, FormGroup, ProgressBar, ProjectStatusBadge, Avatar, Loading, EmptyState, Icons } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function ProjectModal({ project, onClose, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEdit = !!project;

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const res = await updateProject(project.id, form);
        onSave(res.data);
      } else {
        const res = await createProject(form);
        onSave(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Project' : 'New Project'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <FormGroup label="Project Name">
        <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Website Revamp" />
      </FormGroup>
      <FormGroup label="Description">
        <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" />
      </FormGroup>
      {isEdit && (
        <FormGroup label="Status">
          <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </FormGroup>
      )}
    </Modal>
  );
}

function ProjectCard({ project, isAdmin, onEdit, onDelete }) {
  const pct = project.task_count ? Math.round((project.done_count / project.task_count) * 100) : 0;
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1, marginRight: 8 }}>{project.name}</h3>
          <ProjectStatusBadge status={project.status} />
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>
          {project.description || 'No description provided.'}
        </p>
        <div style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--text2)' }}>Progress</span>
            <span style={{ fontWeight: 600 }}>{pct}%</span>
          </div>
          <ProgressBar value={project.done_count} max={project.task_count || 1} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
          <span>{project.done_count}/{project.task_count} tasks done</span>
          <span>{project.member_count} member{project.member_count !== 1 ? 's' : ''}</span>
        </div>
      </div>
      {isAdmin && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => onEdit(project)}>
            <Icons.Edit /> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => onDelete(project)}>
            <Icons.Trash /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    getProjects()
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved) => {
    setProjects(prev => {
      const exists = prev.find(p => p.id === saved.id);
      if (exists) return prev.map(p => p.id === saved.id ? { ...p, ...saved } : p);
      return [{ ...saved, task_count: 0, done_count: 0, member_count: 1 }, ...prev];
    });
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This will also delete all its tasks.`)) return;
    try {
      await deleteProject(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete project.');
    }
  };

  return (
    <Layout
      title="Projects"
      actions={isAdmin && (
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModal('project'); }}>
          <Icons.Plus /> New Project
        </button>
      )}
    >
      {loading ? <Loading /> : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description={isAdmin ? 'Create your first project to get started.' : 'You have not been added to any projects.'}
          action={isAdmin && <button className="btn btn-primary" onClick={() => setModal('project')}><Icons.Plus /> New Project</button>}
        />
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              isAdmin={isAdmin}
              onEdit={(p) => { setEditing(p); setModal('project'); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal === 'project' && (
        <ProjectModal
          project={editing}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
}
