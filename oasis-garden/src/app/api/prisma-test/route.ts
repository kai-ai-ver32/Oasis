import { randomUUID } from "node:crypto";
import { getVerifiedUser } from "@/lib/auth/verified-user";
import { db } from "@/prisma/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }

  let user;
  try {
    user = await getVerifiedUser();
  } catch {
    console.error("Supabase user verification failed.");
    return Response.json(
      { error: "Could not verify the current user." },
      { status: 503 },
    );
  }

  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return Response.json(
      { error: "Not an admin" },
      { status: 403 },
    );
  }

  try {
    const sampleUser = await db.transaction(async (tx) => {
      const email = `prisma-test-${randomUUID()}@example.test`;
      const created = await tx.orm.public.User.create({
        email,
        name: "Prisma connection test",
      });

      const retrieved = await tx.orm.public.User.first({ id: created.id });
      if (!retrieved) {
        throw new Error("The inserted sample user could not be retrieved.");
      }

      await tx.orm.public.User.where({ id: created.id }).delete();

      const remaining = await tx.orm.public.User.first({ id: created.id });
      if (remaining) {
        throw new Error("The sample user was not deleted.");
      }

      return retrieved;
    });

    return Response.json({ user: sampleUser, deleted: true });
  } catch (cause) {
    const details =
      cause instanceof Error
        ? cause.message.replace(
            /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
            "[redacted database URL]",
          )
        : "Unknown database error";
    console.error("Prisma sample test failed:", details);

    return Response.json(
      {
        error:
          "The database test failed. Check the server logs; the Prisma tables may need to be initialized.",
      },
      { status: 500 },
    );
  }
}
