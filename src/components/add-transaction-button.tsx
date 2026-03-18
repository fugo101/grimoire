"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TransactionForm } from "@/components/transaction-form";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Category } from "@/lib/db/schema";

export function AddTransactionButton({
  categories,
}: {
  categories: Category[];
}) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button />}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm giao dịch
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm giao dịch</DialogTitle>
          </DialogHeader>
          <TransactionForm
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Thêm giao dịch
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Thêm giao dịch</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <TransactionForm
            categories={categories}
            onSuccess={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
