import { guardApiRequest } from "@/server/http-auth";
import { getOverview } from "@/server/overview.queries";
import { overviewSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const denied = await guardApiRequest(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const parsed = overviewSchema.safeParse({
    month: searchParams.get("month") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json({ error: "invalid_month" }, { status: 400 });
  }

  return Response.json(await getOverview(parsed.data.month));
}
