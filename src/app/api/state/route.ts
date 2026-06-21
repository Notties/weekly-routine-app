import { requireUser } from "@/lib/api/auth";
import { handle, json } from "@/lib/api/http";
import { getCachedState } from "@/lib/api/state";

export async function GET(req: Request) {
  return handle(async () => {
    const userId = await requireUser(req); // verify นอก use cache
    const slice = await getCachedState(userId);
    return json(slice);
  });
}
