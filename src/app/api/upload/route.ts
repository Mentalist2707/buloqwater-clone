import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Tizimga kiring" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Fayl tanlanmadi" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Fayl 5MB dan oshmasligi kerak" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Faqat rasm (jpg, png, webp)" }, { status: 400 });
    }

    // addRandomSuffix: true makes unique filenames automatically
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload error:", error);

    // Agar private store bo'lsa — public o'rniga boshqa yondashuv
    if (error?.message?.includes("private")) {
      return NextResponse.json(
        { error: "Blob store 'public' rejimga o'tkazilishi kerak. Vercel → Storage → Settings → Public Access yoqing." },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: "Yuklashda xatolik" }, { status: 500 });
  }
}
