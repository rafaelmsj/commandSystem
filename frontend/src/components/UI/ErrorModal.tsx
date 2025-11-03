// components/modals/ErrorModal.tsx
import React from 'react';
import Modal from './Modal';
import Button from './Button';

interface ErrorModalProps {
  isOpen: boolean;
  errorMessage: string;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, errorMessage, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Erro">
      <div className="space-y-4">
        <p>{errorMessage}</p>
        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
