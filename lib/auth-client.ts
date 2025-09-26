export async function login(args: {
  pk: string | number;
  identifier: string;
  type?: string;
  remember?: boolean;      // NEW
  signedAt?: number;       // OPTIONAL: SIWE completion timestamp (ms)
}) {
  const r = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e?.error || `Login failed (${r.status})`);
  }
  return r.json();
}

export async function logout() {
  await fetch("/api/auth", { method: "DELETE" });
}

export async function getSession() {
  const r = await fetch("/api/auth");
  return r.json();
}
