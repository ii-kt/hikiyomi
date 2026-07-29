import type { Env } from "./types";
import {
  fallbackV2Narrative,
  type V2FortuneDraft
} from "./v2/fortune";

/**
 * Kept under the existing function name for call-site compatibility.
 * V3 deliberately does not call a generative model: the displayed summary is
 * assembled only from deterministic, already-calculated result fields.
 */
export async function createV2Narrative(
  _env: Env,
  fortune: V2FortuneDraft
): Promise<string> {
  return fallbackV2Narrative(fortune);
}
