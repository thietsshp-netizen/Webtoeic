import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions) as any;
  return NextResponse.json({ 
    id: session?.user?.id, 
    email: session?.user?.email,
    role: session?.user?.role
  });
}
