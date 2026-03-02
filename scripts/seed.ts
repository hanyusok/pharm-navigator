import { PrismaClient } from "@prisma/client";
import fs from "fs";
import csv from "csv-parser";

const prisma = new PrismaClient();

const BATCH_SIZE = 1000;

async function main() {
    const pharmacies: any[] = [];
    let batchCount = 0;

    console.log("Reading CSV file...");

    fs.createReadStream("pharm_db.csv", { encoding: "utf8" })
        .pipe(csv())
        .on("data", (data) => {
            // Assuming keys from CSV header match below. We extract from original keys (e.g., '좌표(X)')
            // '암호화요양기호','요양기관명','종별코드','종별코드명','시도코드','시도코드명','시군구코드','시군구코드명','읍면동','우편번호','주소','전화번호','개설일자','좌표(X)','좌표(Y)'

            const id = data["암호화요양기호"] || data["\uFEFF암호화요양기호"];
            const name = data["요양기관명"];
            const typeCode = data["종별코드"];
            const typeDesc = data["종별코드명"];
            const cityCode = data["시도코드"];
            const cityDesc = data["시도코드명"];
            const sigunguCode = data["시군구코드"];
            const sigunguDesc = data["시군구코드명"];
            const dong = data["읍면동"];
            const zipCode = data["우편번호"];
            const address = data["주소"];
            const phone = data["전화번호"];
            const openDate = data["개설일자"];
            const lat = parseFloat(data["좌표(Y)"]); // Y is Lat
            const lng = parseFloat(data["좌표(X)"]); // X is Lng

            if (id && name) {
                pharmacies.push({
                    id,
                    name,
                    typeCode,
                    typeDesc,
                    cityCode,
                    cityDesc,
                    sigunguCode,
                    sigunguDesc,
                    dong,
                    zipCode,
                    address,
                    phone,
                    openDate,
                    lat: isNaN(lat) ? null : lat,
                    lng: isNaN(lng) ? null : lng,
                });
            }
        })
        .on("end", async () => {
            console.log(`Parsed ${pharmacies.length} pharmacies. Starting insertion in batches of ${BATCH_SIZE}...`);

            try {
                for (let i = 0; i < pharmacies.length; i += BATCH_SIZE) {
                    const batch = pharmacies.slice(i, i + BATCH_SIZE);
                    await prisma.pharmacy.createMany({
                        data: batch,
                        skipDuplicates: true,
                    });
                    batchCount++;
                    console.log(`Inserted batch ${batchCount} (${i + batch.length} records)`);
                }
                console.log("Database seeded successfully!");
            } catch (e) {
                console.error("Error during insertion:", e);
            } finally {
                await prisma.$disconnect();
            }
        });
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
