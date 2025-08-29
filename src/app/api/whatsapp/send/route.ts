import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { to, message } = await req.json();

    if (!to || typeof to !== "string") {
      return NextResponse.json({ error: "Campo 'to' é obrigatório" }, { status: 400 });
    }
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Campo 'message' é obrigatório" }, { status: 400 });
    }

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return NextResponse.json(
        { error: "Configuração do WhatsApp ausente. Defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env" },
        { status: 500 }
      );
    }

    // Sanitize destination: keep only digits
    const sanitizedTo = String(to).replace(/\D/g, "");

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: sanitizedTo,
      type: "text" as const,
      text: {
        preview_url: false,
        body: message,
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const detail = data?.error?.message || resp.statusText;
      return NextResponse.json({ error: `Falha ao enviar WhatsApp: ${detail}` }, { status: resp.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error("Erro ao enviar WhatsApp:", e);
    return NextResponse.json({ error: "Erro interno ao enviar WhatsApp" }, { status: 500 });
  }
}
