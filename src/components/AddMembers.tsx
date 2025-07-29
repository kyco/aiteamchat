import React, { useState } from 'react';
import { ChatMember } from '../types/chat';
import { CustomMemberModal } from './CustomMemberModal';
import { renderAvatar } from '../utils/avatar';
import { sortMembers } from '../utils/memberSort';

interface AddMembersProps {
  members: ChatMember[];
  userMembers: ChatMember[];
  onClose: () => void;
  onAddMember: (member: ChatMember) => void;
  onCreateMember: (member: ChatMember) => void;
  onMemberInfoClick: (member: ChatMember) => void;
}

export const AddMembers: React.FC<AddMembersProps> = ({
  members,
  userMembers,
  onClose,
  onAddMember,
  onCreateMember,
  onMemberInfoClick
}) => {
  const [showCustomModal, setShowCustomModal] = useState(false);

  const handleAddClick = (member: ChatMember) => {
    onAddMember(member);
  };

  const handleCreateMember = (member: ChatMember) => {
    onCreateMember(member);
    setShowCustomModal(false);
  };

  // Check if a member has been added to user's list
  const isMemberAdded = (memberId: string) => {
    return userMembers.some(userMember => userMember.id === memberId);
  };

  return (
    <>
      <div className="member-management">
        <div className="member-management-header">
          <h3>Add Members</h3>
          <button className="member-info-close" onClick={onClose}>×</button>
        </div>

        <div className="member-management-content">
          <div className="add-members-header">
            <button
              className="create-member-btn-primary"
              onClick={() => setShowCustomModal(true)}
            >
              + Create Custom Member
            </button>
          </div>

          <div className="or-divider">
            <span className="or-divider-text">Or select from our experts below</span>
          </div>

          <div className="member-management-list">
            {sortMembers(members.filter(member => member.isSystem)).map((member) => (
              <div
                key={member.id}
                className="member-management-item"
                style={{ cursor: 'default' }}
              >
                <div className="member-avatar" style={{ backgroundColor: member.color }}>
                  {renderAvatar(member.avatar)}
                </div>
                <div className="member-info">
                  <div className="member-name-row">
                    <span className="member-name">{member.name}</span>
                    {member.isSystem && <span className="member-system-badge">System</span>}
                    {member.isDefault && <span className="member-default-badge">Default</span>}
                    {member.isHidden && <span className="member-hidden-badge">Hidden</span>}
                  </div>
                  <div className="member-role">{member.role}</div>
                </div>
                <div className="member-actions">
                  <button
                    className="member-info-btn"
                    onClick={() => onMemberInfoClick(member)}
                    title="View member details"
                  >
                    ℹ️
                  </button>
                  {isMemberAdded(member.id) ? (
                    <span className="member-added-badge">Added</span>
                  ) : (
                    <button
                      className="member-add-btn"
                      onClick={() => handleAddClick(member)}
                      title="Add member to conversation"
                    >
                      ➕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CustomMemberModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onCreateMember={handleCreateMember}
      />
    </>
  );
};
