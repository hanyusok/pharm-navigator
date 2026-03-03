import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const swLat = parseFloat(searchParams.get("swLat") || "-90");
    const swLng = parseFloat(searchParams.get("swLng") || "-180");
    const neLat = parseFloat(searchParams.get("neLat") || "90");
    const neLng = parseFloat(searchParams.get("neLng") || "180");

    try {
        const pharmacies = await prisma.pharmacy.findMany({
            where: {
                lat: {
                    gte: swLat,
                    lte: neLat,
                },
                lng: {
                    gte: swLng,
                    lte: neLng,
                },
                phone: {
                    not: null,
                },
                NOT: {
                    phone: "",
                },
            },
            take: 200, // Limit to 200 to prevent overloading map
            select: {
                id: true,
                name: true,
                lat: true,
                lng: true,
                address: true,
                phone: true
            }
        });

        return NextResponse.json(pharmacies);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "An error occurred while fetching pharmacies" },
            { status: 500 }
        );
    }
}
