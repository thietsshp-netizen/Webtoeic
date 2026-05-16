import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const { processPart5Batch } = require('../src/lib/gemini');

async function test() {
  console.log("Testing Gemini Part 5 Enrichment...");
  const key = process.env.GEMINI_API_KEY || "";
  console.log("Using API Key starting with:", key.substring(0, 7) + "...");
  
  const sample = [
    "103. Mr. Okello’s promotion means that -------- will supervise a larger team.\r\n(A) he\r\n(B) his\r\n(C) him\r\n(D) himself"
  ];

  try {
    const result = await processPart5Batch(sample);
    console.log("Success! Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Test failed!");
    if (error.response) {
      console.error("Status:", error.status);
      console.error("Details:", JSON.stringify(error, null, 2));
    } else {
      console.error(error);
    }
  }
}

test();
