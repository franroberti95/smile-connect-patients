import { timingSafeEqual } from "node:crypto"
import { revalidatePath, revalidateTag } from "next/cache"

function isAuthorized(header: string | null, secret: string) {
  const expected = Buffer.from(`Bearer ${secret}`)
  const actual = Buffer.from(header ?? "")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

/** Called by the admin app after a landing page is published or unpublished. */
export async function POST(request: Request) {
  const secret = process.env.LANDING_REVALIDATE_SECRET
  if (!secret || !isAuthorized(request.headers.get("authorization"), secret)) {
    return Response.json({ ok: false }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const slug = typeof body?.slug === "string" ? body.slug : ""
  if (!/^[a-z0-9-]{1,120}$/i.test(slug)) return Response.json({ ok: false }, { status: 400 })

  revalidateTag(`landing:${slug}`, { expire: 0 })
  revalidatePath(`/clinica/${slug}`)
  revalidatePath("/sitemap.xml")
  return Response.json({ ok: true })
}
