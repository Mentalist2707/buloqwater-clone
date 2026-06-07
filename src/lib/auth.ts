import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.companyId = user.companyId;
        token.subdomain = user.subdomain;
        token.phone = user.phone;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.companyId = token.companyId;
        session.user.subdomain = token.subdomain;
        session.user.phone = token.phone;
      }
      return session;
    },
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Telefon", type: "text" },
        password: { label: "Parol", type: "password" },
        subdomain: { label: "Subdomain", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Telefon va parol kiritilishi shart");
        }

        const { phone: rawPhone, password, subdomain } = credentials;

        // Telefon raqamni normalizatsiya qilish
        let phone = rawPhone.replace(/\D/g, "");
        if (phone.startsWith("998") && phone.length === 12) {
          phone = `+${phone}`;
        } else if (phone.length === 9) {
          phone = `+998${phone}`;
        } else if (rawPhone.startsWith("+")) {
          phone = rawPhone;
        } else {
          phone = `+998${phone}`;
        }

        // SUPER ADMIN
        if (!subdomain || subdomain === "app" || subdomain === "www") {
          const user = await prisma.user.findFirst({
            where: {
              phone,
              role: "SUPER_ADMIN",
              companyId: null,
              isActive: true,
            },
          });

          if (!user) throw new Error("Foydalanuvchi topilmadi");

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) throw new Error("Parol noto'g'ri");

          return {
            id: user.id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            companyId: null,
            subdomain: null,
          };
        }

        // TENANT USER
        const company = await prisma.company.findUnique({
          where: { subdomain },
        });

        if (!company) {
          throw new Error(`"${subdomain}" subdomeni topilmadi`);
        }

        if (company.status === "SUSPENDED") {
          throw new Error("Bu kompaniya faoliyati to'xtatilgan");
        }

        const user = await prisma.user.findFirst({
          where: {
            phone,
            companyId: company.id,
            isActive: true,
          },
        });

        if (!user) throw new Error("Foydalanuvchi topilmadi");

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error("Parol noto'g'ri");

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          companyId: company.id,
          subdomain: company.subdomain,
        };
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
