"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransaction } from "@/app/actions/transactions";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatVND, formatDateTime } from "@/lib/format";
import type { Category } from "@/lib/db/schema";

type TransactionRow = {
  id: string;
  amount: number;
  note: string;
  date: string;
  categoryId: string;
  categoryName: string | null;
};

export function TransactionTable({
  transactions,
  categories,
}: {
  transactions: TransactionRow[];
  categories: Category[];
}) {
  const [editingTx, setEditingTx] = useState<TransactionRow | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const editForm = editingTx ? (
    <TransactionForm
      categories={categories}
      defaultValues={{
        id: editingTx.id,
        amount: editingTx.amount,
        note: editingTx.note,
        date: editingTx.date,
        categoryId: editingTx.categoryId,
      }}
      onSuccess={() => setEditingTx(null)}
    />
  ) : null;

  if (transactions.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        Chưa có giao dịch nào. Hãy thêm giao dịch đầu tiên!
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(tx.date)}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {tx.note || "—"}
                </TableCell>
                <TableCell>{tx.categoryName ?? "—"}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatVND(tx.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingTx(tx)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Xoá giao dịch"
                      description="Bạn có chắc chắn muốn xoá giao dịch này?"
                      onConfirm={() => deleteTransaction(tx.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isDesktop ? (
        <Dialog
          open={!!editingTx}
          onOpenChange={(open) => !open && setEditingTx(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa giao dịch</DialogTitle>
            </DialogHeader>
            {editForm}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer
          open={!!editingTx}
          onOpenChange={(open) => !open && setEditingTx(null)}
        >
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Sửa giao dịch</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6">{editForm}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
