import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const clinicSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome da clínica é obrigatório"),
  localizacao: z.string().optional().nullable(),
  mediaDeMedicos: z.number().optional().nullable(),
  instagram: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  linkBio: z.string().optional().nullable(),
  contato: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

const outboundSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  especialidade: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  status: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  clinics: z.array(clinicSchema).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || '').toLowerCase();

    // Buscar todos os contatos de outbound do usuário atual
    const outbounds = await prisma.outbound.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (format === 'csv') {
      const headers = [
        'id',
        'nome',
        'especialidade',
        'instagram',
        'whatsapp',
        'email',
        'status',
        'observacoes',
        'endereco',
        'createdAt',
        'updatedAt',
      ];

      const escapeCsv = (val: unknown) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (/[",\n]/.test(str)) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = outbounds.map((o) => [
        o.id,
        o.nome,
        o.especialidade ?? '',
        o.instagram ?? '',
        o.whatsapp ?? '',
        o.email ?? '',
        o.status ?? '',
        o.observacoes ?? '',
        o.endereco ?? '',
        (o as any).createdAt?.toISOString?.() ?? String((o as any).createdAt),
        (o as any).updatedAt?.toISOString?.() ?? String((o as any).updatedAt),
      ].map(escapeCsv).join(','));

      const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');
      const filename = `outbound-${new Date().toISOString().slice(0, 10)}.csv`;
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(outbounds);
  } catch (error) {
    console.error("Erro ao buscar contatos de outbound:", error);
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
    const validatedData = outboundSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Extrair clínicas para processar separadamente
    const { clinics, ...outboundData } = validatedData.data;

    // Gerar um ID único
    const id = `outb_${crypto.randomBytes(16).toString("hex")}`;

    // Criar o novo registro
    const outbound = await prisma.outbound.create({
      data: {
        id,
        userId: session.user.id,
        nome: outboundData.nome,
        especialidade: outboundData.especialidade,
        instagram: outboundData.instagram,
        whatsapp: outboundData.whatsapp,
        email: outboundData.email,
        status: outboundData.status || "prospectado",
        observacoes: outboundData.observacoes,
        endereco: outboundData.endereco,
      },
    });

    // Se houver clínicas, cria-las e associá-las ao contato
    if (clinics && clinics.length > 0) {
      for (const clinicData of clinics) {
        // Criar a clínica
        const clinicId = `clin_${crypto.randomBytes(16).toString("hex")}`;
        const clinic = await prisma.clinic.create({
          data: {
            id: clinicId,
            nome: clinicData.nome,
            localizacao: clinicData.localizacao,
            mediaDeMedicos: clinicData.mediaDeMedicos,
            instagram: clinicData.instagram,
            site: clinicData.site,
            linkBio: clinicData.linkBio,
            contato: clinicData.contato,
            email: clinicData.email,
            whatsapp: clinicData.whatsapp,
            observacoes: clinicData.observacoes,
          },
        });

        // Associar a clínica ao contato
        await prisma.outboundClinic.create({
          data: {
            outboundId: outbound.id,
            clinicId: clinic.id,
          },
        });
      }
    }

    // Buscar o contato com clínicas associadas para retornar
    const outboundWithClinics = await prisma.outbound.findUnique({
      where: { id: outbound.id },
      include: {
        clinics: {
          include: {
            clinic: true,
          },
        },
      },
    });

    // Transformar o resultado para um formato mais amigável
    const result = {
      ...outboundWithClinics,
      clinics: outboundWithClinics?.clinics.map(rel => rel.clinic) || [],
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar contato de outbound:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 