import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Extract YouTube ID
const getYouTubeId = (url: string) => {
  let videoId = "";
  try {
    if (url.includes("embed/")) videoId = url.split("embed/")[1]?.split("?")[0];
    else if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];
    else videoId = url; // assume it's already an ID
  } catch (e) {}
  return videoId.trim();
};

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Missing videoUrl" }, { status: 400 });
    }

    const videoId = getYouTubeId(videoUrl);
    if (!videoId) {
      return NextResponse.json({ success: false, error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Path to the python script
    const scriptPath = path.join(process.cwd(), "scripts", "get_youtube_subs.py");

    // Execute Python script to get English subtitles
    const { stdout } = await execAsync(`python3 "${scriptPath}" ${videoId}`);
    
    if (stdout.startsWith("ERROR:")) {
      return NextResponse.json({ success: false, error: stdout }, { status: 500 });
    }

    const cleanSubs = JSON.parse(stdout);
    if (!Array.isArray(cleanSubs) || cleanSubs.length === 0) {
      return NextResponse.json({ success: false, error: "No subtitles found or failed to parse" }, { status: 500 });
    }

    // Return the raw subtitles (no Gemini API calls to save cost)
    return NextResponse.json({ success: true, subtitles: cleanSubs });
  } catch (error: any) {
    console.error("[AUTO_SUBTITLE_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to process request" }, { status: 500 });
  }
}
