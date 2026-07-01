/**
 * Notification helper — foydalanuvchilarga bildirishnoma yaratish
 * ────────────────────────────────────────────────────────────
 * Ushbu yordamchi butun backend bo'ylab bildirishnoma yaratish
 * uchun yagona nuqta. Har bir bildirishnoma bitta foydalanuvchiga
 * (userId) tegishli.
 */
import { prisma } from "@/lib/prisma";

type NotificationType =
  | "INVITATION"
  | "INVITATION_ACCEPTED"
  | "INVITATION_REJECTED"
  | "ORDER"
  | "SYSTEM";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
}

/** Bitta foydalanuvchiga bildirishnoma yaratadi. */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ? JSON.stringify(input.data) : null,
    },
  });
}

/** Bir nechta foydalanuvchiga bir xil bildirishnoma yaratadi. */
export async function createNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">,
) {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return;
  await prisma.notification.createMany({
    data: unique.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ? JSON.stringify(input.data) : null,
    })),
  });
}

/**
 * Kompaniya rahbariga (DIRECTOR) va ko'rsatilgan xodimlarga bildirishnoma.
 * `extraUserIds` — masalan, taklifni yuborgan operator.
 */
export async function notifyCompanyDirectors(
  companyId: string,
  input: Omit<CreateNotificationInput, "userId">,
  extraUserIds: string[] = [],
) {
  const directors = await prisma.user.findMany({
    where: { companyId, role: "DIRECTOR", isActive: true },
    select: { id: true },
  });
  const ids = [...directors.map((d) => d.id), ...extraUserIds];
  await createNotifications(ids, input);
}
