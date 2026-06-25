/**
 * POST /api/v1/superadmin/companies/[id]/toggle — kompaniya bloklash/faollashtirish
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRoles, unauthorized, forbidden, success, serverError, badRequest } from "@/lib/api-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorized();
    if (!requireRoles(user.role, ["SUPER_ADMIN"])) return forbidden();

    const company = await prisma.company.findUnique({ where: { id: params.id } });
    if (!company) return badRequest("Kompaniya topilmadi");

    const newStatus = company.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    await prisma.company.update({ where: { id: params.id }, data: { status: newStatus } });

    await prisma.activityLog.create({
      data: {
        action: newStatus === "SUSPENDED" ? "company_suspended" : "company_activated",
        description: `${company.name} kompaniyasi ${newStatus === "SUSPENDED" ? "muzlatildi" : "faollashtirildi"}`,
        companyId: company.id,
      },
    });

    return success({ message: `Kompaniya ${newStatus === "SUSPENDED" ? "muzlatildi" : "faollashtirildi"}`, status: newStatus });
  } catch {
    return serverError();
  }
}
