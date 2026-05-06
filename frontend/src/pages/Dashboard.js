import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDashboard } from '../api';
import { StatusBadge, PriorityBadge, Avatar, Loading, isOverdue } from '../components/UI';
import { useAuth } from '../context/AuthContext';

function MiniBar({ label, value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value}</span>
      </div>
      <div className="progress">
        <div className="progress-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    getDashboard()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><Loading /></Layout>;
  if (!data) return <Layout title="Dashboard"><p>Could not load dashboard.</p></Layout>;

  const totalForBar = isAdmin ? (data.total_tasks || 1) : (data.my_tasks || 1);

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{isAdmin ? 'Total Projects' : 'My Projects'}</div>
          <div className="stat-value blue">{isAdmin ? data.total_projects : data.my_projects || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{isAdmin ? 'Total Tasks' : 'Assigned to Me'}</div>
          <div className="stat-value">{isAdmin ? data.total_tasks : data.my_tasks || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value green">{data.tasks_done || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value red">{data.overdue_tasks || 0}</div>
          {(data.overdue_tasks || 0) > 0 && <div className="stat-sub">Needs attention</div>}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Task Breakdown</span></div>
          <div className="card-body">
            <MiniBar label="To Do" value={data.tasks_todo || 0} total={totalForBar} color="#6b7280" />
            <MiniBar label="In Progress" value={data.tasks_in_progress || 0} total={totalForBar} color="#d97706" />
            <MiniBar label="Done" value={data.tasks_done || 0} total={totalForBar} color="#16a34a" />
          </div>
        </div>

        {isAdmin && data.project_summary?.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">Projects Progress</span></div>
            <div style={{ padding: 0 }}>
              {data.project_summary.map(p => (
                <div key={p.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{p.done_tasks}/{p.total_tasks}</span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${p.total_tasks ? Math.round(p.done_tasks / p.total_tasks * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {data.recent_tasks?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Tasks</span>
          </div>
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
                </tr>
              </thead>
              <tbody>
                {data.recent_tasks.map(task => (
                  <tr key={task.id}>
                    <td className="task-title-cell">
                      {isOverdue(task.due_date, task.status) && <span className="dot-overdue" />}
                      {task.title}
                    </td>
                    <td className="text-muted">{task.project_name}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={task.assignee_name} size="sm" />
                        <span className="text-muted">{task.assignee_name || '—'}</span>
                      </div>
                    </td>
                    <td><PriorityBadge priority={task.priority} /></td>
                    <td><StatusBadge status={task.status} /></td>
                    <td style={{ color: isOverdue(task.due_date, task.status) ? 'var(--red)' : 'var(--text2)', fontSize: 12 }}>
                      {task.due_date || '—'}
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
