const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsage() {
    try {
        console.log("Đang kiểm tra dung lượng...");
        
        // Database size
        const dbSizeResult = await prisma.$queryRaw`SELECT pg_size_pretty(pg_database_size(current_database())) as size;`;
        console.log(`- Dung lượng Database hiện tại: ${dbSizeResult[0].size}`);
        
        // Storage size
        const storageSizeResult = await prisma.$queryRaw`SELECT sum((metadata->>'size')::numeric) as total_bytes FROM storage.objects;`;
        
        const bytes = storageSizeResult[0].total_bytes;
        let storageSizeStr = "0 bytes";
        if (bytes) {
            const mb = (Number(bytes) / (1024 * 1024)).toFixed(2);
            storageSizeStr = `${mb} MB`;
        }
        
        console.log(`- Dung lượng Storage (File) hiện tại: ${storageSizeStr}`);
        
        console.log("\n(Ghi chú: Giới hạn của gói Free Supabase thường là 500MB cho Database và 1GB cho Storage)");
        
    } catch (e) {
        console.error("Lỗi khi kiểm tra:", e);
    } finally {
        await prisma.$disconnect();
    }
}

checkUsage();
