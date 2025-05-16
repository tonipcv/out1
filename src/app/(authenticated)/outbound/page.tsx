import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OutboundTable from "@/components/OutboundTable";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";

interface PageProps {
  searchParams: {
    page?: string;
    limit?: string;
  };
}

export default async function OutboundPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const skip = (page - 1) * limit;

  const [outbounds, total] = await Promise.all([
    prisma.outbound.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: skip,
    }),
    prisma.outbound.count({
      where: {
        userId: session.user.id,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-[100dvh] bg-gray-100 pb-24 lg:pb-16 lg:ml-52 px-2 sm:px-4">
      <div className="container mx-auto px-0 sm:pl-4 md:pl-8 lg:pl-0 max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[85%] pt-20 lg:pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-[-0.03em] font-inter">Gestão de Outbound</h2>
            <p className="text-xs md:text-sm text-gray-600 tracking-[-0.03em] font-inter">Gerencie seus contatos de outbound</p>
          </div>
          
          <Link href="/outbound/pipeline">
            <Button 
              variant="outline" 
              className="bg-white shadow-sm"
            >
              <ViewColumnsIcon className="h-4 w-4 mr-2" />
              Ver Pipeline
            </Button>
          </Link>
        </div>

        <Card className="bg-gray-800/5 border-0 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.16)] transition-all duration-300 rounded-2xl">
          <CardContent className="pt-6 pb-4 sm:pb-3 px-6 sm:px-4">
            <OutboundTable 
              initialOutbounds={outbounds} 
              currentPage={page} 
              totalPages={totalPages} 
              totalItems={total}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 