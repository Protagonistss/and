import React from 'react';
import { useConversationStore, useUIStore } from '../../stores';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { conversations, currentConversationId, setCurrentConversation, createConversation, deleteConversation } =
    useConversationStore();
  const { mode } = useUIStore();

  const handleNewChat = () => {
    createConversation();
  };

  const handleDeleteChat = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个对话吗？')) {
      deleteConversation(id);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>{mode === 'agent' ? '对话历史' : '文件浏览器'}</h3>
        {mode === 'agent' && (
          <button className="sidebar-action" onClick={handleNewChat} title="新对话">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        )}
      </div>

      <div className="sidebar-content">
        {mode === 'agent' ? (
          <div className="conversation-list">
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>暂无对话</p>
                <p className="hint">点击上方按钮开始新对话</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${
                    currentConversationId === conversation.id ? 'active' : ''
                  }`}
                  onClick={() => setCurrentConversation(conversation.id)}
                >
                  <div className="conversation-info">
                    <span className="conversation-title">{conversation.title}</span>
                    <span className="conversation-time">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="conversation-delete"
                    onClick={(e) => handleDeleteChat(e, conversation.id)}
                    title="删除"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16">
                      <path
                        fill="currentColor"
                        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="file-tree">
            <div className="empty-state">
              <p>文件浏览器</p>
              <p className="hint">功能开发中...</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
