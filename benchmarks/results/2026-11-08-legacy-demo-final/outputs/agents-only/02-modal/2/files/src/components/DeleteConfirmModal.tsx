"use client";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

export interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title = "상품 삭제",
  description = "이 상품을 삭제하시겠습니까? 삭제한 상품은 복구할 수 없습니다.",
}: DeleteConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="delete-confirm-description">
        <DialogTitle>{title}</DialogTitle>
        <p
          id="delete-confirm-description"
          className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]"
        >
          {description}
        </p>
        <div className="mt-[var(--space-5)] flex justify-end gap-[var(--space-2)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
