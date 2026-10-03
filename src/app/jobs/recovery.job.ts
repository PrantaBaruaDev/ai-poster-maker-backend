import { posterRepository } from "../modules/poster/poster.repository";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * On server boot, mark any poster stuck in GENERATING longer than
 * 5 minutes as FAILED. Prevents zombies after a crash/restart.
 */
export async function recoverStuckPosters(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - FIVE_MINUTES_MS);
    const result = await posterRepository.failStuckGenerating(cutoff);
    if (result.count > 0) {
      console.log(`♻️  Recovered ${result.count} stuck poster(s) → FAILED`);
    } else {
      console.log("♻️  No stuck posters to recover");
    }
  } catch (err) {
    console.error("♻️  Recovery failed:", err);
  }
}