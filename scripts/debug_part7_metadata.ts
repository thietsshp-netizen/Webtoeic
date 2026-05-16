import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const groups = await prisma.toeicQuestionGroup.findMany({
    where: { part: { partNumber: 7 } },
    select: { metadata: true }
  });

  const complexities = new Set();
  const categories = new Set();
  const mapping: Record<string, Set<string>> = {};

  groups.forEach(g => {
    const m = g.metadata as any;
    const comp = m?.complexity;
    const cat = m?.category;
    
    if (comp) complexities.add(comp);
    if (cat) categories.add(cat);
    
    if (comp && cat) {
      if (!mapping[comp]) mapping[comp] = new Set();
      mapping[comp].add(cat);
    }
  });

  console.log("Unique Complexities:", Array.from(complexities));
  console.log("Unique Categories:", Array.from(categories));
  console.log("Mapping:", Object.fromEntries(Object.entries(mapping).map(([k, v]) => [k, Array.from(v)])));
}

main().catch(console.error).finally(() => pool.end());
