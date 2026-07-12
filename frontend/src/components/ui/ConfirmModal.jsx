import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal.jsx";
import { Button } from "./Button.jsx";

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDeleting = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} icon={AlertTriangle} maxWidth="max-w-md">
      <div className="p-6">
        <p className="text-slate-600 dark:text-slate-300 mb-8">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
