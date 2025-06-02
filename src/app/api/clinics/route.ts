import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const clinicSchema = z.object({
  nome: z.string().min(1, "Nome da clínica é obrigatório"),
  localizacao: z.string().optional().nullable(),
  mediaDeMedicos: z.number().optional().nullable(),
  instagram: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  linkBio: z.string().optional().nullable(),
  contato: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Construir filtros de busca
    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: 'insensitive' as const } },
            { localizacao: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // Buscar clínicas com paginação
    const [clinics, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.clinic.count({ where }),
    ]);

    return NextResponse.json({
      clinics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar clínicas:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    
    // Validar os dados
    const validatedData = clinicSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Criar a nova clínica
    const clinic = await prisma.clinic.create({
      data: validatedData.data,
    });

    return NextResponse.json(clinic, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar clínica:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 