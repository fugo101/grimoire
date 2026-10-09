import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { TransactionForm } from "@/features/transactions/transaction-form";
import type { FundingSource, Purpose } from "@/lib/db/schema";

/**
 * Two presentations of one thing: the inline button at the top of the
 * transactions page (desktop), and the floating circular button in the app
 * shell (mobile), which is reachable from any tab.
 */
export function AddTransactionButton({
  purposes,
  fundingSources,
  appearance = "inline",
}: {
  purposes: Purpose[];
  fundingSources: FundingSource[];
  appearance?: "inline" | "floating";
}) {
  const t = useTranslations("transactions");
  const [open, setOpen] = useState(false);

  const trigger =
    appearance === "floating" ? (
      <Button
        size="icon"
        aria-label={t("add")}
        className="size-14 rounded-full shadow-lg"
      >
        <Plus className="size-6" />
      </Button>
    ) : (
      <Button>
        {/* No margin: Button already spaces its children with `gap-1.5`. */}
        <Plus />
        {t("add")}
      </Button>
    );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={t("add")}
      trigger={trigger}
    >
      <TransactionForm
        purposes={purposes}
        fundingSources={fundingSources}
        onSuccess={() => setOpen(false)}
      />
    </ResponsiveModal>
  );
}
