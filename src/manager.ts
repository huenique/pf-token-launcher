/**
 * References:
 * [1] https://github.com/kryptobrah/solana-pump-fun-trading-bot/blob/main/src/swap.ts
 * [2] https://github.com/solana-trading-scripts/pumpfun_volume_bot/blob/main/index.js
 * [3] https://github.com/pump-fun-official/pump-fun-bot/blob/main/sell.py
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

// Helper functions [2], [3]
import {
  getKeyPairFromPrivateKey,
  createTransaction,
  sendAndConfirmTransactionWrapper,
  bufferFromUInt64,
} from "./utils";

// Constants – referenced in [1] and [2]
import {
  GLOBAL,
  FEE_RECIPIENT,
  SYSTEM_PROGRAM_ID,
  ASSOC_TOKEN_ACC_PROG,
  TOKEN_PROGRAM_ID,
  PUMP_FUN_ACCOUNT,
  PUMP_FUN_PROGRAM,
  TOKEN_DECIMALS,
} from "./constants";

// Coin data retrieval function – see [2]
import { getCoinData } from "./data";

/**
 * Monitors coin data for a specified market cap threshold and auto‑sells your tokens once the threshold is reached.
 *
 * References:
 * - Helper functions [2], [3]
 * - Sell instruction layout and fee/reserve calculations [3]
 * - Transaction handling and account creation [1], [2]
 *
 * @param deployerPrivateKey - Payer’s private key (base58 string).
 * @param mintAddress - The token mint address as a string.
 * @param marketCapThreshold - The market cap threshold to trigger a sell.
 * @param slippage - Slippage tolerance as a decimal fraction, representing the maximum acceptable deviation from the estimated SOL output. For example, a value of 0.25 means you are willing to accept up to a 25% reduction in the expected SOL amount (i.e., you expect to receive at least 75% of the estimated output). Defaults to 0.25 (25%).
 * @param pollInterval - Polling interval in milliseconds (default: 60000).
 */
export async function monitorAndAutoSell(
  deployerPrivateKey: string,
  mintAddress: string,
  marketCapThreshold: number,
  slippage: number = 0.25,
  pollInterval: number = 60000,
) {
  // Use the custom RPC endpoint [1]
  const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  const payer = await getKeyPairFromPrivateKey(deployerPrivateKey);
  const owner = payer.publicKey;
  const mint = new PublicKey(mintAddress);

  const interval = setInterval(async () => {
    try {
      // Retrieve current coin data [2]
      const coinData = await getCoinData(mintAddress);
      if (!coinData) {
        console.error("Failed to retrieve coin data.");
        return;
      }

      // Assume coinData.market_cap is provided (or computed) [3]
      const currentMarketCap = Number(coinData.market_cap);
      console.log("Current Market Cap:", currentMarketCap);

      if (currentMarketCap >= marketCapThreshold) {
        console.log("Market cap threshold reached. Preparing sell transaction...");

        // Get or create the associated token account [2]
        const tokenAccountAddress = await getAssociatedTokenAddress(mint, owner, false);
        const txBuilder = new Transaction();
        const tokenAccountInfo = await connection.getAccountInfo(tokenAccountAddress);
        if (!tokenAccountInfo) {
          txBuilder.add(
            createAssociatedTokenAccountInstruction(owner, tokenAccountAddress, owner, mint),
          );
        }

        // Retrieve token balance [2]
        const tokenBalanceResponse = await connection.getTokenAccountBalance(tokenAccountAddress);
        if (!tokenBalanceResponse.value) {
          console.error("No token balance found.");
          clearInterval(interval);
          return;
        }
        const tokenBalance = parseInt(tokenBalanceResponse.value.amount);
        if (tokenBalance === 0) {
          console.log("Token balance is zero. Nothing to sell.");
          clearInterval(interval);
          return;
        }

        // Calculate minimum SOL output.
        // Formula: tokenBalance * (1 - slippage) * (virtual_sol_reserves / virtual_token_reserves)
        // Calculation inspired by [3]
        const virtualSol = Number(coinData.virtual_sol_reserves);
        const virtualToken = Number(coinData.virtual_token_reserves);
        const minSolOutput = Math.floor(
          tokenBalance * (1 - slippage) * (virtualSol / virtualToken),
        );
        console.log(
          `Selling ${tokenBalance / 10 ** TOKEN_DECIMALS} tokens for a minimum of ${(
            minSolOutput / LAMPORTS_PER_SOL
          ).toFixed(10)} SOL`,
        );

        // Build the sell instruction data.
        // Layout: [discriminator (8 bytes)] + [tokenBalance (8 bytes)] + [minSolOutput (8 bytes)]
        // Discriminator "12502976635542562355" from [3]
        const sellDiscriminator = "12502976635542562355";
        const data = Buffer.concat([
          bufferFromUInt64(sellDiscriminator),
          bufferFromUInt64(tokenBalance),
          bufferFromUInt64(minSolOutput),
        ]);

        // Construct the list of accounts required by the sell instruction [2], [3]
        const keys = [
          { pubkey: GLOBAL, isSigner: false, isWritable: false },
          { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
          { pubkey: mint, isSigner: false, isWritable: false },
          { pubkey: new PublicKey(coinData.bonding_curve), isSigner: false, isWritable: true },
          {
            pubkey: new PublicKey(coinData.associated_bonding_curve),
            isSigner: false,
            isWritable: true,
          },
          { pubkey: tokenAccountAddress, isSigner: false, isWritable: true },
          { pubkey: owner, isSigner: true, isWritable: true },
          { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: ASSOC_TOKEN_ACC_PROG, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: PUMP_FUN_ACCOUNT, isSigner: false, isWritable: false },
          { pubkey: PUMP_FUN_PROGRAM, isSigner: false, isWritable: false },
        ];

        // Create the sell instruction [3]
        const instruction = new TransactionInstruction({
          keys,
          programId: PUMP_FUN_PROGRAM,
          data,
        });
        txBuilder.add(instruction);

        // Build, sign, and send the transaction.
        // Transaction handling inspired by [1] and [2]
        const transaction = await createTransaction(connection, txBuilder.instructions, owner);
        const signature = await sendAndConfirmTransactionWrapper(connection, transaction, [payer]);
        console.log("Sell transaction confirmed:", signature);

        // Stop the polling once the sell has been executed.
        clearInterval(interval);
      }
    } catch (error) {
      console.error("Error during market cap monitoring or sell execution:", error);
    }
  }, pollInterval);
}
