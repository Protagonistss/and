import React from 'react';
import { useUIStore } from '../../stores';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export interface AppLayoutProps {
  children: React.ReactNode;
  agentPanel?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, agentPanel }) => {
  const { sidebarVisible, mode } = useUIStore();

  return (
    <div className="app-layout">
      <Header />
      <div className="app-body">
        {sidebarVisible && <Sidebar />}
        <main className="app-main">
          {children}
        </main>
        {mode === 'agent' && agentPanel && (
          <aside className="agent-panel">
            {agentPanel}
          </aside>
        )}
      </div>
    </div>
  );
};
