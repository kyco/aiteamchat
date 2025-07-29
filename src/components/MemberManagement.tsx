import React, { useState } from 'react';
import { ChatMember } from '../types/chat';
import { ConfirmDialog } from './ConfirmDialog';
import { renderAvatar } from '../utils/avatar';
import { sortMembers } from '../utils/memberSort';

interface MemberManagementProps {
  members: ChatMember[];
  onClose: () => void;
  onToggleVisibility: (memberId: string, isHidden: boolean) => void;
  onDelete: (memberId: string) => void;
  onMemberSelect?: (member: ChatMember) => void;
  onEdit?: (member: ChatMember) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onClose,
  onToggleVisibility,
  onDelete,
  onMemberSelect,
  onEdit
}) => {
  const [memberToDelete, setMemberToDelete] = useState<ChatMember | null>(null);

  const handleMemberInfoClick = (member: ChatMember) => {
    if (onMemberSelect) {
      onMemberSelect(member);
    }
  };

  const handleEditClick = (member: ChatMember) => {
    if (onEdit) {
      onEdit(member);
    }
  };

  const handleToggleVisibility = (member: ChatMember) => {
    onToggleVisibility(member.id, !member.isHidden);
  };

  const handleDeleteClick = (member: ChatMember) => {
    setMemberToDelete(member);
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      onDelete(memberToDelete.id);
      setMemberToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setMemberToDelete(null);
  };

  return (
    <div className="member-management">
      <div className="member-management-header">
        <h3>Manage Members</h3>
        <button className="member-info-close" onClick={onClose}>×</button>
      </div>

      <div className="member-management-content">
        <p className="member-management-description">
          Click on a member to view their info, or use the buttons to toggle visibility and remove members. Hidden members won't appear in the member selector.
        </p>

        <div className="member-management-list">
          {!members.length?
            <div className="no-members">No members selected. Go to the "Add" screen to add system experts or create your own.</div>
          :null}
          {sortMembers(members).map((member) => (
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMemberInfoClick(member);
                  }}
                  title="View member details"
                >
                  ℹ️
                </button>
                <button
                  className="member-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(member);
                  }}
                  title="Edit member"
                >
                  ✏️
                </button>
                <button
                  className="member-visibility-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(member);
                  }}
                  title={member.isHidden ? 'Show member' : 'Hide member'}
                >
                  {member.isHidden ? '👁️‍🗨️' : '👁️'}
                </button>
                <button
                  className="member-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(member);
                  }}
                  title="Remove member"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <ConfirmDialog
          isOpen={!!memberToDelete}
          title="Remove Member"
          message={
            memberToDelete
              ? `Are you sure you want to remove ${memberToDelete.name} from your member list?`
              : ''
          }
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};
