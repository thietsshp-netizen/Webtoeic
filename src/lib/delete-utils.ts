import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Checks if a list of files are referenced elsewhere in the database 
 * and deletes them from Supabase Storage only if they are orphaned.
 */
export async function checkAndCleanupFiles(
  fileNames: string[], 
  bucketName: string = "lessons",
  exclusionIds: {
    courseIds?: string[];
    sectionIds?: string[];
    lessonIds?: string[];
    toeicQuestionGroupIds?: string[];
  } = {}
) {
  if (!fileNames || fileNames.length === 0) return;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    console.error("[CLEANUP_FILES_ERROR] Supabase Admin not initialized");
    return;
  }

  // Filter out null/empty names and deduplicate
  const validFiles = Array.from(new Set(fileNames.filter(Boolean)));
  const filesToDelete: string[] = [];

  for (const fileName of validFiles) {
    // 1. Check Course cover image
    const courseRef = await prisma.course.findFirst({
      where: { 
        coverImage: fileName,
        NOT: { id: { in: exclusionIds.courseIds || [] } }
      }
    });
    if (courseRef) continue;

    // 2. Check Lesson content or videoUrl
    const lessonRef = await prisma.lesson.findFirst({
      where: {
        OR: [
          { content: fileName },
          { videoUrl: fileName }
        ],
        NOT: { id: { in: exclusionIds.lessonIds || [] } }
      }
    });
    if (lessonRef) continue;

    // 3. Check ToeicQuestionGroup audio or image
    const toeicRef = await prisma.toeicQuestionGroup.findFirst({
      where: {
        OR: [
          { audioUrl: fileName },
          { imageUrl: fileName }
        ],
        NOT: { id: { in: exclusionIds.toeicQuestionGroupIds || [] } }
      }
    });
    if (toeicRef) continue;

    // If NO other references found, mark for deletion
    filesToDelete.push(fileName);
  }

  if (filesToDelete.length > 0) {
    console.log(`[CLEANUP_FILES] Deleting ${filesToDelete.length} files from bucket "${bucketName}"`);
    const { error } = await supabaseAdmin.storage
      .from(bucketName)
      .remove(filesToDelete);
    
    if (error) {
      console.error("[CLEANUP_FILES_ERROR]", error);
    }
  }
}

