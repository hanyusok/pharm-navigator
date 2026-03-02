import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const pharmacy = await prisma.pharmacy.findUnique({
            where: { id: id },
            include: {
                faxs: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!pharmacy) {
            return NextResponse.json({ message: "Pharmacy not found" }, { status: 404 });
        }

        return NextResponse.json(pharmacy);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
