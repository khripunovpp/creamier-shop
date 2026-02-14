import {verify} from "jsonwebtoken";
import {Context, Next} from "hono";

export async function requireAdmin(c: Context, next: Next) {
  const cookie = c.req.header("Cookie");
  if (!cookie) return c.text("Unauthorized", 401);

  const token = parseCookie(cookie)?.admin_token;
  if (!token) return c.text("Unauthorized", 401);

  try {
    const payload = verify(token, c.env.JWT_SECRET) as any;

    if (payload.role !== "admin") {
      return c.text("Forbidden", 403);
    }

    c.set("adminId", payload.id);
    await next();
  } catch {
    return c.text("Forbidden", 403);
  }
}

function parseCookie(cookie: string) {
  return Object.fromEntries(
    cookie.split("; ").map((v) => {
      const [key, value] = v.split("=");
      return [key, value];
    })
  );
}