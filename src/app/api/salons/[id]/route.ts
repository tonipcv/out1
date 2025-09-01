import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const salonUpdateSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  endereco: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  numeroDeUnidades: z.number().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await prisma.salon.findUnique({ where: { id: params.id } });
    if (!salon) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

    return NextResponse.json(salon);
  } catch (e) {
    console.error("Erro ao buscar salão:", e);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validated = salonUpdateSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validated.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.salon.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

    if (validated.data.nome && validated.data.nome !== existing.nome) {
      const dup = await prisma.salon.findFirst({
        where: { nome: { equals: validated.data.nome, mode: "insensitive" } },
      });
      if (dup && dup.id !== params.id) {
        return NextResponse.json(
          { error: "Já existe um salão com este nome" },
          { status: 409 }
        );
      }
    }

    const data = { ...validated.data, email: validated.data.email === "" ? null : validated.data.email };

    const updated = await prisma.salon.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error("Erro ao atualizar salão:", e);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const existing = await prisma.salon.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });

    await prisma.salon.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Erro ao excluir salão:", e);
    return NextResponse.json({ error: "Erro ao processar a solicitação" }, { status: 500 });
  }
}
