
const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.lvbdcqoagtrzvnaeeznm:J_D9hUt7z3v*Pgj@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT g.metadata, g."imageUrl", p."partNumber"
    FROM "ToeicQuestionGroup" g
    JOIN "ToeicPart" p ON g."partId" = p.id
    WHERE p."partNumber" IN (3, 4)
  `);

  const stats = {
    part3: { graphic: 0, noGraphic: 0 },
    part4: { graphic: 0, noGraphic: 0 }
  };

  res.rows.forEach(g => {
    const meta = g.metadata || {};
    const hasGraphic = (meta.pic_id && String(meta.pic_id).trim() !== "") || 
                       (meta.PicID && String(meta.PicID).trim() !== "") ||
                       (g.imageUrl && g.imageUrl.trim() !== "") ||
                       (String(meta.has_graphic || "").toLowerCase().trim() === "yes");

    const partNum = g.partNumber;
    if (partNum === 3) {
      if (hasGraphic) stats.part3.graphic++;
      else stats.part3.noGraphic++;
    } else if (partNum === 4) {
      if (hasGraphic) stats.part4.graphic++;
      else stats.part4.noGraphic++;
    }
  });

  console.log(JSON.stringify(stats, null, 2));
  await client.end();
}

run();
