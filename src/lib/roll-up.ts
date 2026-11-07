import type { FundingShare, PurposeTotal, TransactionRow } from "@/lib/types";

/**
 * Each Purpose's Gross cost, with its Funding split.
 *
 * The one place this roll-up is written. The admin's overview and a Share
 * Link's Public Report both show it, and each used to carry its own copy —
 * copies that once disagreed (one keyed by name), so the same rows could roll
 * up differently depending on who was looking. Keyed by **id**: two Purposes
 * that share a name are still two Purposes.
 */
export function rollUpByPurpose(rows: TransactionRow[]): PurposeTotal[] {
  type Bucket = Omit<PurposeTotal, "byFundingSource"> & {
    split: Map<string, FundingShare>;
  };
  const buckets = new Map<string, Bucket>();

  for (const row of rows) {
    let bucket = buckets.get(row.purposeId);
    if (!bucket) {
      bucket = {
        id: row.purposeId,
        name: row.purposeName,
        total: 0,
        split: new Map(),
      };
      buckets.set(row.purposeId, bucket);
    }
    bucket.total += row.amount;

    const share = bucket.split.get(row.fundingSourceId);
    if (share) share.total += row.amount;
    else
      bucket.split.set(row.fundingSourceId, {
        id: row.fundingSourceId,
        name: row.fundingSourceName,
        total: row.amount,
      });
  }

  return [...buckets.values()]
    .sort(byTotalDescending)
    .map(({ split, ...bucket }) => ({
      ...bucket,
      byFundingSource: [...split.values()].sort(byTotalDescending),
    }));
}

function byTotalDescending(a: { total: number }, b: { total: number }) {
  return b.total - a.total;
}
