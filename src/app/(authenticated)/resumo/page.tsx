import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startOfDay, endOfDay } from "date-fns";

async function getData() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  const [
    totalDoctors,
    todayOutbounds,
    statusCounts,
    specialtyCounts
  ] = await Promise.all([
    // Total de médicos
    prisma.outbound.count({
      where: {
        userId: session.user.id,
      },
    }),
    // Outbounds adicionados hoje
    prisma.outbound.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    // Contagem por status
    prisma.outbound.groupBy({
      by: ["status"],
      where: {
        userId: session.user.id,
        status: {
          not: null,
        },
      },
      _count: true,
    }),
    // Contagem por especialidade
    prisma.outbound.groupBy({
      by: ["especialidade"],
      where: {
        userId: session.user.id,
        especialidade: {
          not: null,
        },
      },
      _count: true,
    }),
  ]);

  return {
    totalDoctors,
    todayOutbounds,
    statusCounts,
    specialtyCounts,
  };
}

export default async function ResumePage() {
  const data = await getData();

  return (
    <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] pt-20 lg:pt-6">
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Resumo</h2>
          <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Visão geral dos seus contatos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Médicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalDoctors}</div>
              <p className="text-xs text-gray-500">médicos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Adicionados Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.todayOutbounds.length}</div>
              <p className="text-xs text-gray-500">novos contatos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Especialidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.specialtyCounts.length}</div>
              <p className="text-xs text-gray-500">diferentes especialidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.statusCounts.find(s => s.status === "respondeu")?._count || 0}
              </div>
              <p className="text-xs text-gray-500">médicos responderam</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status dos Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.statusCounts.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        status.status === "abordado"
                          ? "bg-gray-500"
                          : status.status === "respondeu"
                          ? "bg-blue-500"
                          : status.status === "interessado"
                          ? "bg-amber-500"
                          : status.status === "publicou link"
                          ? "bg-green-500"
                          : status.status === "upgrade lead"
                          ? "bg-purple-500"
                          : "bg-gray-500"
                      }`} />
                      <span className="text-sm font-medium capitalize">
                        {status.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{status._count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Especialidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.specialtyCounts
                  .sort((a, b) => b._count - a._count)
                  .slice(0, 5)
                  .map((specialty) => (
                    <div key={specialty.especialidade} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{specialty.especialidade}</span>
                      <span className="text-sm text-gray-500">{specialty._count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contatos Adicionados Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayOutbounds.length > 0 ? (
              <div className="space-y-4">
                {data.todayOutbounds.map((outbound) => (
                  <div key={outbound.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h3 className="font-medium">{outbound.nome}</h3>
                      <p className="text-sm text-gray-500">{outbound.especialidade || "Sem especialidade"}</p>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      outbound.status === "abordado"
                        ? "bg-gray-100 text-gray-800"
                        : outbound.status === "respondeu"
                        ? "bg-blue-100 text-blue-800"
                        : outbound.status === "interessado"
                        ? "bg-amber-100 text-amber-800"
                        : outbound.status === "publicou link"
                        ? "bg-green-100 text-green-800"
                        : outbound.status === "upgrade lead"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {outbound.status || "Novo"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum contato adicionado hoje
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 