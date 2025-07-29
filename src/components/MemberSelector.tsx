import React from 'react';
import { ChatMember } from '../types/chat';
import { renderAvatar } from '../utils/avatar';

interface MemberSelectorProps {
  members: ChatMember[];
  selectedMembers: ChatMember[];
  onMemberToggle: (member: ChatMember) => void;
  onMemberInfoClick: (member: ChatMember) => void;
  onAddMembers: () => void;
  onManageMembers: () => void;
  onNewChat: () => void;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMembers,
  onMemberToggle,
  onMemberInfoClick,
  onAddMembers,
  onManageMembers,
  onNewChat
}) => {
  const isSelected = (member: ChatMember) =>
    selectedMembers.some(selected => selected.id === member.id);

  const handleInfoClick = (e: React.MouseEvent, member: ChatMember) => {
    e.stopPropagation(); // Prevent triggering the member toggle
    onMemberInfoClick(member);
  };

  // Filter out hidden members for the main display
  const visibleMembers = members.filter(member => !member.isHidden);

  return (
    <div className="member-selector">
      <div className="member-selector-header">
        <button
          className="new-chat-btn"
          onClick={onNewChat}
        >
          New Chat
        </button>
      </div>
      <div className="member-selector-content">
        <div className="member-list">
          {visibleMembers.map((member) => (
            <div
              key={member.id}
              className={`member-card ${isSelected(member) ? 'selected' : ''}`}
              onClick={() => onMemberToggle(member)}
              style={{ borderColor: isSelected(member) ? member.color : '#e5e7eb' }}
            >
              <div className="member-avatar" style={{ backgroundColor: member.color }}>
                {renderAvatar(member.avatar)}
              </div>
              <div className="member-info">
                <div className="member-name-row">
                  <span className="member-name">{member.name}</span>
                  <button
                    className="member-info-btn"
                    onClick={(e) => handleInfoClick(e, member)}
                    title={`Learn more about ${member.name}`}
                  >
                    ℹ️
                  </button>
                </div>
                <div className="member-role">{member.role || 'Not provided'}</div>
              </div>
              <div className="member-actions">
                {isSelected(member) && (
                  <div className="member-selected-indicator">✓</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="member-selector-footer">
          <button
            className="create-member-btn"
            onClick={onAddMembers}
          >
            + Add Members
          </button>
          <button
            className="manage-members-btn"
            onClick={onManageMembers}
          >
            Manage
          </button>
        </div>
      </div>
    </div>
  );
};
