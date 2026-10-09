import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { formatDateTime } from "@/lib/format";
import { useFormatters } from "@/hooks/use-formatters";
import type { TransactionTableFeatures } from "@/features/transactions/table-features";
import type { TransactionTableRow } from "@/lib/types";

/**
 * The Purpose, with the Funding Source muted beside it.
 *
 * This column used to render a breadcrumb — "Nguồn › Mục" — which read as one
 * nested thing and put the pot first, in front of the answer to the question
 * the row is actually about. Two independent values sit side by side instead,
 * with the one being asked about carrying the emphasis.
 */
function Dimensions({ row }: { row: TransactionTableRow }) {
  return (
    <>
      {row.purposeName}
      <span className="ml-2 text-muted-foreground">
        {row.fundingSourceName}
      </span>
    </>
  );
}

type ActionHandlers = {
  onEdit: (row: TransactionTableRow) => void;
  onDelete: (id: string) => void;
};

/**
 * The dashboard table's columns. The public report used to share this
 * definition and hide the `actions` column; it now renders its own card list,
 * so this serves one screen and the column order is free again.
 */
/** A component rather than a call so the cell can read the active locale. */
function Amount({ amount }: { amount: number }) {
  const { formatVND } = useFormatters();
  return formatVND(amount);
}

/**
 * Headers are components for the same reason: `flexRender` renders a function
 * header as an element, so it can translate itself.
 */
function ColumnHeader({
  column,
}: {
  column: "date" | "note" | "dimensions" | "amount";
}) {
  const t = useTranslations("transactions.columns");
  return t(column);
}

function RowActions({
  row,
  handlers,
}: {
  row: TransactionTableRow;
  handlers: ActionHandlers;
}) {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("common.editItem", {
          name: row.note || t("transactions.unnamed"),
        })}
        onClick={() => handlers.onEdit(row)}
      >
        <Pencil />
      </Button>
      <ConfirmDialog
        trigger={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("common.deleteItem", {
              name: row.note || t("transactions.unnamed"),
            })}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        }
        title={t("transactions.deleteTitle")}
        description={t("transactions.deleteConfirm")}
        onConfirm={() => handlers.onDelete(row.id)}
      />
    </div>
  );
}

export function transactionColumns(
  handlers?: ActionHandlers
): ColumnDef<TransactionTableFeatures, TransactionTableRow>[] {
  return [
    {
      id: "date",
      accessorKey: "date",
      header: () => <ColumnHeader column="date" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          {formatDateTime(row.original.date)}
        </span>
      ),
      // Matches the SQL ordering: date desc with createdAt as the tie-break.
      sortFn: (a, b) =>
        a.original.date.localeCompare(b.original.date) ||
        a.original.createdAt.localeCompare(b.original.createdAt),
    },
    {
      id: "note",
      accessorKey: "note",
      header: () => <ColumnHeader column="note" />,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block truncate">{row.original.note || "—"}</span>
      ),
    },
    {
      id: "dimensions",
      header: () => <ColumnHeader column="dimensions" />,
      // Sorted and filtered on the pair as one string, Purpose first, so
      // ordering follows what the column leads with.
      accessorFn: (row) => `${row.purposeName} ${row.fundingSourceName}`,
      cell: ({ row }) => (
        <span className="whitespace-nowrap">
          <Dimensions row={row.original} />
        </span>
      ),
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: () => <ColumnHeader column="amount" />,
      meta: { align: "right" as const },
      cell: ({ row }) => (
        <span className="block text-right font-medium">
          <Amount amount={row.original.amount} />
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) =>
        handlers ? <RowActions row={row.original} handlers={handlers} /> : null,
    },
  ];
}
