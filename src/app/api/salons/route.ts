import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const salonSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  endereco: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  numeroDeUnidades: z.number().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const format = searchParams.get("format") || "";

    const skip = (page - 1) * limit;

    const where: any = search
      ? {
          OR: [
            { nome: { contains: search, mode: "insensitive" as const } },
            { endereco: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { telefone: { contains: search, mode: "insensitive" as const } },
            { instagram: { contains: search, mode: "insensitive" as const } },
            { site: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    if (format.toLowerCase() === "csv") {
      const all = await prisma.salon.findMany({ where, orderBy: { createdAt: "desc" } });
      const headers = [
        "id",
        "nome",
        "endereco",
        "instagram",
        "email",
        "telefone",
        "site",
        "numeroDeUnidades",
        "createdAt",
        "updatedAt",
      ];
      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
        return str;
      };
      const rows = all
        .map((s) =>
          [
            s.id,
            s.nome,
            s.endereco ?? "",
            s.instagram ?? "",
            s.email ?? "",
            s.telefone ?? "",
            s.site ?? "",
            s.numeroDeUnidades ?? "",
            s.createdAt?.toISOString?.() ?? String(s.createdAt),
            s.updatedAt?.toISOString?.() ?? String(s.updatedAt),
          ]
            .map(escapeCsv)
            .join(",")
        )
        .join("\n");
      const csv = "\ufeff" + [headers.join(","), rows].filter(Boolean).join("\n");
      const filename = `saloes-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const [salons, total] = await Promise.all([
      prisma.salon.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.salon.count({ where }),
    ]);

    return NextResponse.json({
      salons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("Erro ao buscar salões:", e);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = salonSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validated.error.format() },
        { status: 400 }
      );
    }

    const exists = await prisma.salon.findFirst({
      where: { nome: { equals: validated.data.nome, mode: "insensitive" } },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Já existe um salão com este nome" },
        { status: 409 }
      );
    }

    const data = { ...validated.data, email: validated.data.email === "" ? null : validated.data.email };

    const salon = await prisma.salon.create({ data });
    return NextResponse.json(salon, { status: 201 });
  } catch (e) {
    console.error("Erro ao criar salão:", e);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}
