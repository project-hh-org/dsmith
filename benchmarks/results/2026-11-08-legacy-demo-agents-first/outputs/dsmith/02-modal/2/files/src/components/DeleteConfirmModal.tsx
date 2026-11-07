"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

export interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "상품을 삭제할까요?",
  description = "삭제한 상품은 되돌릴 수 없습니다.",
  cancelLabel = "취소",
  confirmLabel = "삭제",
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-ds-xl text-ds-blue-900">{title}</DialogTitle>
        <DialogPrimitive.Description className="mt-ds-2 text-ds-xs text-ds-gray-500">
          {description}
        </DialogPrimitive.Description>
        <div className="mt-ds-5 flex justify-end gap-ds-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
