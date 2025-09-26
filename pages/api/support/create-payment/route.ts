export async function POST(req: Request) {
  const { fiatAmount = 5, fiatCurrency = "USD", orderId } = await req.json();
  const min = Number(process.env.SUPPORT_MIN_USD || 5);
  if (fiatAmount < min) {
    return new Response(JSON.stringify({ error: `Min amount is $${min}` }), { status: 400 });
  }

  const res = await fetch("https://api.paymento.io/v1/payment/request", {
    method: "POST",
    headers: {
      "Api-key": process.env.PAYMENTO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "text/plain",
    },
    body: JSON.stringify({
      fiatAmount: String(fiatAmount),
      fiatCurrency,
      ReturnUrl: process.env.PAYMENTO_RETURN_URL,
      orderId: orderId ?? crypto.randomUUID(),
      Speed: 1,
      additionalData: [{ key: "kind", value: "support-donation" }],
    }),
  });

  const data = await res.json();
  if (!data?.body) return new Response(JSON.stringify({ error: "Paymento request failed" }), { status: 502 });

  return Response.json({ token: data.body, redirectUrl: `https://app.paymento.io/gateway?token=${data.body}` });
}