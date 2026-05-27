import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day");
    const part = searchParams.get("part");
    const hasImage = searchParams.get("hasImage");
    const series = searchParams.get("series");
    const testName = searchParams.get("testName");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const skip = (page - 1) * limit;

    const where: any = {};

    // Lọc theo metadata (sử dụng Prisma JSON filter)
    if (day) {
      where.metadata = { path: ["day"], equals: parseInt(day) };
    }
    if (part) {
      if (!where.metadata) where.metadata = {};
      where.metadata = { ...where.metadata, path: ["part"], equals: parseInt(part) };
    }
    if (hasImage !== null && hasImage !== "") {
      if (!where.metadata) where.metadata = {};
      where.metadata = { ...where.metadata, path: ["hasImage"], equals: hasImage === "true" };
    }

    const complexity = searchParams.get("complexity");
    const category = searchParams.get("category");

    if (complexity) {
      if (!where.metadata) where.metadata = {};
      where.metadata = { ...where.metadata, path: ["complexity"], equals: complexity };
    }
    if (category) {
      if (!where.metadata) where.metadata = {};
      where.metadata = { ...where.metadata, path: ["category"], equals: category };
    }

    // Lọc theo PartNumber nếu không dùng metadata
    if (part && !day) {
        where.part = { partNumber: parseInt(part) };
    }

    const [groups, total] = await Promise.all([
      prisma.toeicQuestionGroup.findMany({
        where,
        include: {
          questions: {
            orderBy: { questionNo: "asc" }
          },
          part: {
            include: {
              test: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.toeicQuestionGroup.count({ where })
    ]);

    return NextResponse.json({
      groups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error("[TOEIC_LIBRARY_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
