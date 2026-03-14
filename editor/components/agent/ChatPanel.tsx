import React, { useRef, useEffect } from 'react';
import type { Message } from '../../services/llm/types';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import './ChatPanel.css';

interface ChatPanelProps {
  messages: Message[];
  inputValue: string;
  isProcessing: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  onStop: () => void;
  onClearError: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  inputValue,
  isProcessing,
  error,
  onInputChange,
  onSubmit,
  onStop,
  onClearError,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部 - 当消息数量变化时滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 清除错误
  useEffect(() => {
    if (error) {
      const timer = setTimeout(onClearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, onClearError]);

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-error">
          <span>{error}</span>
          <button onClick={onClearError}>×</button>
        </div>
      )}

      <InputArea
        value={inputValue}
        isProcessing={isProcessing}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onStop={onStop}
      />
    </div>
  );
};
