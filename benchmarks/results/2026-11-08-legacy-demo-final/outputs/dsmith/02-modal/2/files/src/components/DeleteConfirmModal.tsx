"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  productName?: string;
  title?: string;
  description?: string;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  productName,
  title = "상품을 삭제할까요?",
  description,
}: DeleteConfirmModalProps) {
  const descriptionText =
    description ??
    (productName
      ? `'${productName}' 상품을 삭제하면 되돌릴 수 없습니다.`
      : "삭제한 상품은 되돌릴 수 없습니다.");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="delete-confirm-description">
        <DialogTitle>{title}</DialogTitle>
        <p
          id="delete-confirm-description"
          className="mt-[var(--space-2)] text-[length:var(--text-xs)] text-[color:var(--color-gray-500)]"
        >
          {descriptionText}
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
