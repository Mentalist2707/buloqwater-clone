/**
 * Invitations Service — mijozlik takliflari bilan ishlash (CUSTOMER)
 * ────────────────────────────────────────────────────────────
 *   GET  /profile/invitations              → kutilayotgan takliflar
 *   POST /profile/invitations/:id/accept   → qabul qilish
 *   POST /profile/invitations/:id/reject   → rad etish
 */
import { api } from "./api";

export interface Invitation {
  id: string;
  status: string;
  company: { id: string; name: string; subdomain: string };
  invitedBy: { name: string; role: string };
  invitedAt: string;
  expiresAt: string;
}

export const invitationsService = {
  async getInvitations() {
    return api.get<Invitation[]>("/profile/invitations");
  },

  async acceptInvitation(id: string) {
    return api.post(`/profile/invitations/${id}/accept`);
  },

  async rejectInvitation(id: string) {
    return api.post(`/profile/invitations/${id}/reject`);
  },
};
