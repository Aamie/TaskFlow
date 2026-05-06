import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getTasks, createTask, updateTask, deleteTask, getProjects, getMembers } from '../api';
import { Modal, Alert, FormGroup, StatusBadge, PriorityBadge, Avatar, Loading, EmptyState, Icons, isOverdue } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function TaskModal({ task, projects, members, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || (projects[0]?.id || ''),
    assigned_to: task?.assigned_to || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.project_id) { setError('Please select a project.'); return; }
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null, due_date: form.due_date || null };
      const res = isEdit ? await updateTask(task.id, payload) : await createTask(payload);
      onSave(res.data, isEdit);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving task.');
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Modal
      title={isEdit ? 'Edit Task' : 'New Task'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}
      <FormGroup label="Title">
        <input className="form-control" value={form.title} onChange={set('title')} placeholder="Task title" />
      </FormGroup>
      <FormGroup label="Description">
        <textarea className="form-control" value={form.description} onChange={set('description')} placeholder="Optional details..." />
      </FormGroup>
      <div className="form-row">
        <FormGroup label="Project">
          <select className="form-control" value={form.project_id} onChange={set('project_id')}>
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </FormGroup>
        <FormGroup label="Assign To">
          <select className="form-control" value={form.assigned_to} onChange={set('assigned_to')}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </FormGroup>
      </div>
      <div className="form-row">
        <FormGroup label="Priority">
          <select className="form-control" value={form.priority} onChange={set('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormGroup>
        <FormGroup label="Status">
          <select className="form-control" value={form.status} onChange={set('status')}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </FormGroup>
      </div>
      <FormGroup label="Due Date">
        <input type="date" className="form-control" value={form.due_date} onChange={set('due_date')} />
      </FormGroup>
    </Modal>
  );
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    Promise.all([getTasks(), getProjects(), getMembers()])
      .then(([t, p, m]) => {
        setTasks(t.data);
        setProjects(p.data);
        setMembers(m.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved, isEdit) => {
    setTasks(prev =>
      isEdit ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]
    );
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await updateTask(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === task.id ? res.data : t));
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <Layout
      title="Tasks"
      actions={
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModal('task'); }}>
          <Icons.Plus /> New Task
        </button>
      }
    >
      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            <span style={{ marginLeft: 4, opacity: 0.7, fontSize: 11 }}>
              {f.value === 'all' ? tasks.length : tasks.filter(t => t.status === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={filter !== 'all' ? 'Try a different filter.' : 'Create your first task!'}
          action={<button className="btn btn-primary" onClick={() => setModal('task')}><Icons.Plus /> New Task</button>}
        />
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task.id}>
                    <td className="task-title-cell" style={{ maxWidth: 240 }}>
                      {isOverdue(task.due_date, task.status) && <span className="dot-overdue" />}
                      {task.title}
                    </td>
                    <td className="text-muted text-sm">{task.project_name}</td>
                    <td>
                      {task.assignee_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={task.assignee_name} size="sm" />
                          <span className="text-muted text-sm">{task.assignee_name}</span>
                        </div>
                      ) : <span className="text-muted text-sm">—</span>}
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: 'auto', padding: '3px 8px', fontSize: 12 }}
                        value={task.status}
                        onChange={e => handleStatusChange(task, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td style={{ color: isOverdue(task.due_date, task.status) ? 'var(--red)' : 'var(--text2)', fontSize: 12 }}>
                      {task.due_date || '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-xs" onClick={() => { setEditing(task); setModal('task'); }}>
                          <Icons.Edit />
                        </button>
                        <button className="btn btn-xs btn-danger" onClick={() => handleDelete(task)}>
                          <Icons.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'task' && (
        <TaskModal
          task={editing}
          projects={projects}
          members={members}
          onClose={() => { setModal(null); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </Layout>
  );
}
