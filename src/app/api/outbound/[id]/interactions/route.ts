import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Definição de tipos para as interações
interface ContactInteraction {
  id: string;
  outboundId: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

// GET: Obter todas as interações de um contato
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const outboundId = params.id;

    // Verificar se o outbound pertence ao usuário
    const outbound = await prisma.outbound.findFirst({
      where: {
        id: outboundId,
        userId: session.user.id
      }
    });

    if (!outbound) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }
    
    // Devido à abordagem direta com SQL, precisamos fazer a consulta manualmente
    const interactions = await prisma.$queryRaw<ContactInteraction[]>`
      SELECT * FROM "ContactInteraction"
      WHERE "outboundId" = ${outboundId}
      ORDER BY "createdAt" DESC
    `;
    
    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar interações' },
      { status: 500 }
    );
  }
}

// POST: Adicionar uma nova interação
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const outboundId = params.id;
    const { content, type } = await req.json();
    
    if (!content || !type) {
      return NextResponse.json(
        { error: 'Conteúdo e tipo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o tipo é válido
    const validTypes = ['whatsapp', 'email', 'instagram', 'call', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de interação inválido' },
        { status: 400 }
      );
    }

    // Verificar se o outbound pertence ao usuário
    const outbound = await prisma.outbound.findFirst({
      where: {
        id: outboundId,
        userId: session.user.id
      }
    });

    if (!outbound) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }
    
    // Gerar ID único
    const id = `ci_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    
    // Inserir nova interação
    await prisma.$executeRaw`
      INSERT INTO "ContactInteraction" ("id", "outboundId", "content", "type", "createdAt", "updatedAt")
      VALUES (${id}, ${outboundId}, ${content}, ${type}, ${now}, ${now});
    `;
    
    // Buscar a interação recém-criada
    const newInteraction = await prisma.$queryRaw<ContactInteraction[]>`
      SELECT * FROM "ContactInteraction" WHERE id = ${id}
    `;
    
    return NextResponse.json(newInteraction[0], { status: 201 });
  } catch (error) {
    console.error('Erro ao criar interação:', error);
    return NextResponse.json(
      { error: 'Erro ao criar interação' },
      { status: 500 }
    );
  }
}

// DELETE: Remover uma interação
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const outboundId = params.id;
    const url = new URL(req.url);
    const interactionId = url.searchParams.get('interactionId');
    
    if (!interactionId) {
      return NextResponse.json(
        { error: 'ID da interação não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se o outbound pertence ao usuário
    const outbound = await prisma.outbound.findFirst({
      where: {
        id: outboundId,
        userId: session.user.id
      }
    });

    if (!outbound) {
      return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    }
    
    // Verificar se a interação existe
    const interactionExists = await prisma.$queryRaw<ContactInteraction[]>`
      SELECT * FROM "ContactInteraction"
      WHERE "id" = ${interactionId} AND "outboundId" = ${outboundId}
    `;
    
    if (!interactionExists || interactionExists.length === 0) {
      return NextResponse.json({ error: 'Interação não encontrada' }, { status: 404 });
    }
    
    // Remover interação
    await prisma.$executeRaw`
      DELETE FROM "ContactInteraction"
      WHERE "id" = ${interactionId} AND "outboundId" = ${outboundId}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover interação:', error);
    return NextResponse.json(
      { error: 'Erro ao remover interação' },
      { status: 500 }
    );
  }
} 