/**
 * Agent Trust Score helpers.
 *
 * Formula (documented):
 * - Base 50
 * - +10 identity verified, +10 office verified
 * - +min(15, propertiesSold), +min(10, floor(verifiedListings / 10))
 * - −min(15, documentDisputes * 5), −min(15, cancelledTransactions * 3)
 * - +5 if avgResponseMinutes ≤ 30, +5 if member ≥ 1 year
 * - Clamp 0–100
 */

export type TrustScoreInput = {
  identityVerified: boolean;
  officeVerified: boolean;
  propertiesSold: number;
  verifiedListings: number;
  documentDisputes: number;
  cancelledTransactions: number;
  avgResponseMinutes: number | null | undefined;
  memberSince: Date | string | null | undefined;
};

export function computeTrustScore(input: TrustScoreInput): number {
  let score = 50;

  if (input.identityVerified) score += 10;
  if (input.officeVerified) score += 10;

  score += Math.min(15, Math.max(0, input.propertiesSold));
  score += Math.min(10, Math.floor(Math.max(0, input.verifiedListings) / 10));
  score -= Math.min(15, Math.max(0, input.documentDisputes) * 5);
  score -= Math.min(15, Math.max(0, input.cancelledTransactions) * 3);

  if (
    input.avgResponseMinutes != null &&
    input.avgResponseMinutes >= 0 &&
    input.avgResponseMinutes <= 30
  ) {
    score += 5;
  }

  if (input.memberSince) {
    const since = new Date(input.memberSince);
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    if (!Number.isNaN(since.getTime()) && Date.now() - since.getTime() >= oneYearMs) {
      score += 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export const GOLDEN_SCORE_SUGGESTION = 85;
