import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "admin" | "user";

export async function getVerifiedUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error("Supabase could not verify the current user.");
  }

  if (!data.user) {
    return null;
  }

  const adminUserId = process.env.ADMIN_USER_ID?.toLowerCase();
  const userUserId = process.env.VOLUNTEER_USER_ID?.toLowerCase();

  if (!adminUserId || !userUserId) {
    throw new Error("Supabase role IDs are not configured.");
  }

  const userId = data.user.id.toLowerCase();
  const role: UserRole | null =
    userId === adminUserId ? "admin" : userId === userUserId ? "user" : null;

  return {
    email: data.user.email ?? null,
    role,
  };
}
