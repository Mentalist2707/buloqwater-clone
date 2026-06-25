/**
 * POST /api/v1/superadmin/companies/[id]/subscription — obuna uzaytirish
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

    const body = await request.json();
    const { months = 1, amount = 0 } = body;

    const company = await prisma.company.findUnique({
      where: { id: params.id },
      include: { subscription: true },
    });
    if (!company) return badRequest("Kompaniya topilmadi");

    const startDate = company.subscription?.endDate
      ? new Date(Math.max(new Date(company.subscription.endDate).getTime(), Date.now()))
      : new Date();

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    if (company.subscription) {
      await prisma.subscription.update({
        where: { companyId: params.id },
        data: { endDate, amount: company.subscription.amount + amount },
      });
    } else {
      await prisma.subscription.create({
        data: { companyId: params.id, endDate, amount, isPaid: amount > 0 },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "subscription_extended",
        description: `${company.name} uchun ${months} oylik obuna uzaytirildi`,
        companyId: company.id,
      },
    });

    return success({ message: `${months} oy qo'shildi` });
  } catch {
    return serverError();
  }
}
