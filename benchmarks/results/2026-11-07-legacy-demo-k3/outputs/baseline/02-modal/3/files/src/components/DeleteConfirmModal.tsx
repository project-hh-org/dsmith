"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "./Button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

interface DeleteConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmModal({
  open,
  onCancel,
  onConfirm,
  title = "상품을 삭제할까요?",
  description = "삭제한 상품은 복구할 수 없습니다.",
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogTitle className="text-gray-900">{title}</DialogTitle>
        <DialogPrimitive.Description className="mt-2 text-sm text-gray-500">
          {description}
        </DialogPrimitive.Description>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm}>
            삭제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
