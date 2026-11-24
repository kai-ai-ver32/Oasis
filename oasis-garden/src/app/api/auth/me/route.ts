import { getVerifiedUser } from "@/lib/auth/verified-user";

export async function GET() {
  try {
    const user = await getVerifiedUser();

    if (!user) {
      return Response.json({ role: null }, { status: 401 });
    }

    if (!user.role) {
      return Response.json({ role: null }, { status: 403 });
    }

    return Response.json(user);
  } catch {
    console.error("Supabase user verification failed.");
    return Response.json(
      { error: "Could not verify the current user." },
      { status: 503 },
    );
  }
}
