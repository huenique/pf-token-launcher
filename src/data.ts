import axios from "axios";
import { z } from "zod";

const CoinDataSchema = z.object({
  mint: z.string(),
  name: z.string(),
  symbol: z.string(),
  description: z.string(),
  image_uri: z.string(),
  video_uri: z.string().nullable(),
  metadata_uri: z.string(),
  twitter: z.string(),
  telegram: z.string(),
  bonding_curve: z.string(),
  associated_bonding_curve: z.string(),
  creator: z.string(),
  created_timestamp: z.number(),
  raydium_pool: z.string().nullable(),
  complete: z.boolean(),
  virtual_sol_reserves: z.number(),
  virtual_token_reserves: z.number(),
  total_supply: z.number(),
  website: z.string(),
  show_name: z.boolean(),
  king_of_the_hill_timestamp: z.number(),
  market_cap: z.number(),
  reply_count: z.number(),
  last_reply: z.number(),
  nsfw: z.boolean(),
  market_id: z.string().nullable(),
  inverted: z.any().nullable(),
  is_currently_live: z.boolean(),
  username: z.string().nullable(),
  profile_image: z.string().nullable(),
  usd_market_cap: z.number(),
});

export type CoinData = z.infer<typeof CoinDataSchema>;

/**
 * Fetches and validates coin data from the API.
 * @param mintStr - The coin's mint string identifier.
 * @returns A Promise resolving to validated coin data or null if an error occurs.
 */
export async function getCoinData(mintStr: string): Promise<CoinData | null> {
  try {
    const url = `https://frontend-api-v3.pump.fun/coins/${mintStr}`;
    const response = await axios.get(url);

    if (response.status === 200) {
      const validationResult = CoinDataSchema.safeParse(response.data);
      if (validationResult.success) {
        return validationResult.data;
      } else {
        console.error("Validation error:", validationResult.error);
        return null;
      }
    } else {
      console.error("Failed to retrieve coin data:", response.status);
      return null;
    }
  } catch (error) {
    console.error("Error fetching coin data:", error);
    return null;
  }
}
