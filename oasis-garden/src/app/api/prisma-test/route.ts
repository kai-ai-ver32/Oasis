import { randomUUID } from "node:crypto";
import { db } from "@/prisma/db";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await db.transaction(async (tx) => {
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

    return Response.json({ user, deleted: true });
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
