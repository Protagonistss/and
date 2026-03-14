import React from 'react';
import type { Message } from '../../services/llm/types';
import { MessageItem } from './MessageItem';
import './MessageList.css';

interface MessageListProps {
  messages: Message[];
}

// 生成消息的唯一 key
function getMessageKey(message: { role: string; content: string | { type?: string; text?: string }[] }, index: number): string {
  // 使用角色、索引和内容的一部分生成唯一 key
  const contentStr = typeof message.content === 'string'
    ? message.content
    : message.content.map(c => ('text' in c ? c.text : '')).join('');
  return `${message.role}-${index}-${contentStr.slice(0, 20)}`;
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages
        .filter((msg) => msg.role !== 'system')
        .map((message, index) => (
          <MessageItem key={getMessageKey(message, index)} message={message} />
        ))}
    </div>
  );
};
