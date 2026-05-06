import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ title, actions, children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
          <div className="topbar-actions">{actions}</div>
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
