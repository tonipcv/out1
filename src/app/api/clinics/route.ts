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
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  whatsapp: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  // Prospecting flags
  prospectEmail: z.boolean().optional(),
  prospectCall: z.boolean().optional(),
  prospectWhatsapp: z.boolean().optional(),
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
    const format = searchParams.get('format') || '';
    const missingParam = (searchParams.get('missing') || '').trim();
    const missing = missingParam
      ? missingParam.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const skip = (page - 1) * limit;

    // Construir filtros de busca
    const andFilters: any[] = [];
    if (search) {
      andFilters.push({
        OR: [
          { nome: { contains: search, mode: 'insensitive' as const } },
          { localizacao: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      });
    }
    if (missing.length > 0) {
      const map: Record<string, any> = {
        email: { prospectEmail: false },
        call: { prospectCall: false },
        whatsapp: { prospectWhatsapp: false },
      };
      for (const m of missing) {
        if (map[m]) andFilters.push(map[m]);
      }
    }
    const where = andFilters.length > 0 ? { AND: andFilters } : {};

    // Se solicitado CSV, exportar todos os resultados filtrados
    if (format.toLowerCase() === 'csv') {
      const allClinics = await prisma.clinic.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      const headers = [
        'id',
        'nome',
        'localizacao',
        'mediaDeMedicos',
        'instagram',
        'site',
        'linkBio',
        'contato',
        'email',
        'whatsapp',
        'observacoes',
        'prospectEmail',
        'prospectCall',
        'prospectWhatsapp',
        'createdAt',
        'updatedAt',
      ];

      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Se contiver aspas, vírgula ou quebra de linha, envolver em aspas e escapar aspas internas
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = allClinics.map((c) => [
        c.id,
        c.nome,
        c.localizacao ?? '',
        c.mediaDeMedicos ?? '',
        c.instagram ?? '',
        c.site ?? '',
        c.linkBio ?? '',
        c.contato ?? '',
        c.email ?? '',
        c.whatsapp ?? '',
        c.observacoes ?? '',
        (c as any).prospectEmail ?? false,
        (c as any).prospectCall ?? false,
        (c as any).prospectWhatsapp ?? false,
        c.createdAt?.toISOString?.() ?? String(c.createdAt),
        c.updatedAt?.toISOString?.() ?? String(c.updatedAt),
      ].map(escapeCsv).join(','));

      const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');

      const filename = `clinicas-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Buscar clínicas com paginação (JSON)
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

    // Verificar se já existe uma clínica com o mesmo nome
    const existingClinic = await prisma.clinic.findFirst({
      where: {
        nome: {
          equals: validatedData.data.nome,
          mode: 'insensitive'
        }
      }
    });

    if (existingClinic) {
      return NextResponse.json(
        { error: "Já existe uma clínica com este nome" },
        { status: 409 }
      );
    }

    // Processar o email - se for string vazia, converter para null
    const processedData = {
      ...validatedData.data,
      email: validatedData.data.email === "" ? null : validatedData.data.email
    };

    // Criar a nova clínica
    const clinic = await prisma.clinic.create({
      data: processedData,
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