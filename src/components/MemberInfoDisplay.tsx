import React, { useState } from 'react';
import { ChatMember } from '../types/chat';
import { renderAvatar } from '../utils/avatar';

interface MemberInfoDisplayProps {
  member: ChatMember;
  onClose: () => void;
  onEdit?: (member: ChatMember) => void;
  onDelete?: (memberId: string) => void;
  onToggleHidden?: (memberId: string, isHidden: boolean) => void;
}

export const MemberInfoDisplay: React.FC<MemberInfoDisplayProps> = ({
  member,
  onClose,
  onEdit,
  onDelete,
  onToggleHidden
}) => {
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content member-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-info-display">
          <div className="member-info-header">
            <div className="member-info-avatar" style={{ backgroundColor: member.color }}>
              {renderAvatar(member.avatar)}
            </div>
            <div className="member-info-details">
              <h3 className="member-info-name">{member.name}</h3>
              <p className="member-info-role">{member.role || 'Not provided'}</p>
              {member.isHidden && <span className="member-hidden-badge">Hidden</span>}
            </div>
            <button className="member-info-close" onClick={onClose}>×</button>
          </div>

          <div className="member-info-content">
            <h4>About {member.name}</h4>
            <p className="member-info-description">{member.description || 'Not provided'}</p>

            <div className="member-info-strengths">
              <h4>Strengths & Approach</h4>
              {member.strengths && member.strengths.length > 0 ? (
                <ul>
                  {member.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              ) : (
                <ul>
                  <li>This is a custom team member with their own unique expertise and approach.</li>
                </ul>
              )}
            </div>

            {member.prompt && (
              <div className="member-info-prompt-section">
                <button
                  className="view-prompt-btn"
                  onClick={() => setShowPrompt(!showPrompt)}
                >
                  {showPrompt ? '▼ Hide Prompt' : '▶ View Prompt'}
                </button>

                {showPrompt && (
                  <div className="member-prompt-display">
                    <h4>System Prompt</h4>
                    <div className="prompt-content">
                      {member.prompt}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
