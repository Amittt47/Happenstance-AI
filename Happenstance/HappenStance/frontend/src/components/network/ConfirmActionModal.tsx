"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant?: "danger" | "primary";
  cancelText?: string;
}

export function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  title,
  description,
  confirmText,
  confirmVariant = "danger",
  cancelText = "Cancel",
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      kicker="CONFIRM ACTION"
      title={title}
    >
      <div className="space-y-4 pt-1">
        <p className="text-sm text-[#475569] leading-relaxed">
          {description}
        </p>

        <div className="pt-4 border-t border-[#F1F5F9] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            isLoading={isLoading}
            disabled={isLoading}
            onClick={onConfirm}
            className="min-w-[120px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmActionModal;
