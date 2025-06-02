import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const clinicUpdateSchema = z.object({
  nome: z.string().min(1, "Nome da clínica é obrigatório").optional(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clinicId = params.id;

    // Buscar a clínica
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        outbounds: {
          include: {
            outbound: {
              select: {
                id: true,
                nome: true,
                especialidade: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
    }

    // Transformar o resultado para um formato mais amigável
    const result = {
      ...clinic,
      outbounds: clinic.outbounds.map(rel => rel.outbound),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar clínica:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clinicId = params.id;
    const body = await request.json();
    
    // Validar os dados
    const validatedData = clinicUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    // Verificar se a clínica existe
    const existingClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!existingClinic) {
      return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
    }

    // Atualizar a clínica
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: validatedData.data,
    });

    return NextResponse.json(updatedClinic);
  } catch (error) {
    console.error("Erro ao atualizar clínica:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const clinicId = params.id;

    // Verificar se a clínica existe
    const existingClinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        outbounds: true,
      },
    });

    if (!existingClinic) {
      return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
    }

    // Verificar se há contatos vinculados
    if (existingClinic.outbounds.length > 0) {
      return NextResponse.json(
        { 
          error: "Não é possível excluir a clínica pois há contatos vinculados a ela",
          details: `${existingClinic.outbounds.length} contato(s) vinculado(s)`
        },
        { status: 400 }
      );
    }

    // Excluir a clínica
    await prisma.clinic.delete({
      where: { id: clinicId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir clínica:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 