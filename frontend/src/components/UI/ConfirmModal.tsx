// components/modals/ConfirmModal.tsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'Confirmar',
  message,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="space-y-4">
        <p>{message}</p>
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Confirmar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
