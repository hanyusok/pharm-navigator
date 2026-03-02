import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const faxs = await prisma.faxRecord.findMany({
            where: { pharmacyId: id },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });
        return NextResponse.json(faxs);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await params;
        const { faxNumber } = await req.json();

        if (!faxNumber) {
            return NextResponse.json({ message: "Fax number is required" }, { status: 400 });
        }

        const faxRecord = await prisma.faxRecord.create({
            data: {
                faxNumber,
                pharmacyId: id,
                userId: session.user.id,
            },
        });

        return NextResponse.json(faxRecord, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
