import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          {/* <button className="modal-close" onClick={onCancel}>×</button> */}
        </div>

        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className="delete-confirm-btn">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
