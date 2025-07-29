import React, { useState } from 'react';
import { ConversationEntry } from '../types/chat';
import { ConfirmDialog } from './ConfirmDialog';

interface ConversationHistoryProps {
  conversations: ConversationEntry[];
  selectedConversation: ConversationEntry | null;
  onConversationSelect: (conversation: ConversationEntry) => void;
  onConversationDelete: (conversationId: string) => void;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  selectedConversation,
  onConversationSelect,
  onConversationDelete
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent triggering conversation selection
    setConversationToDelete(conversationId);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      onConversationDelete(conversationToDelete);
    }
    setShowConfirmDialog(false);
    setConversationToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setConversationToDelete(null);
  };

  if (conversations.length === 0) {
    return (
      <div className="conversation-history-empty">
        <p>No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="conversation-history">
      <div className="conversation-history-header">
        <h4 className="history-title">Chats</h4>
      </div>
      <div className="conversation-history-content">
        <div className="conversation-list">
          {conversations.slice().reverse().map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${
                selectedConversation?.id === conversation.id ? 'selected' : ''
              }`}
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="conversation-content">
                <div className="conversation-preview">
                  {conversation.title ||
                   (conversation.exchanges[0]?.userMessage.length > 50
                     ? `${conversation.exchanges[0]?.userMessage.substring(0, 50)}...`
                     : conversation.exchanges[0]?.userMessage)}
                </div>
              </div>
              <button
                className="conversation-delete-btn"
                onClick={(e) => handleDeleteClick(e, conversation.id)}
                title="Delete conversation"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
