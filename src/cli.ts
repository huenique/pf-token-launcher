#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { launchToken } from "./launch";
import { monitorAndAutoSell } from "./sell";

/**
 * CLI Setup
 * Example usage:
 *   node cli.js --privateKey "your_key" --uri "your_uri" --symbol "SYM" --name "TokenName" --marketCap 2000000 --slippage 0.1 --pollInterval 30000
 */
const argv = yargs(hideBin(process.argv))
  .option("privateKey", {
    alias: "p",
    type: "string",
    description: "Deployer's private key in base58 format",
    demandOption: true,
  })
  .option("uri", {
    alias: "u",
    type: "string",
    description: "Token metadata URI",
    demandOption: true,
  })
  .option("symbol", {
    alias: "s",
    type: "string",
    description: "Token symbol",
    demandOption: true,
  })
  .option("name", {
    alias: "n",
    type: "string",
    description: "Token name",
    demandOption: true,
  })
  .option("marketCap", {
    alias: "m",
    type: "number",
    description: "Market cap threshold to trigger auto-sell",
    demandOption: true,
  })
  .option("slippage", {
    alias: "sl",
    type: "number",
    description: "Slippage tolerance as a decimal fraction (default: 0.25 = 25%)",
    default: 0.25,
  })
  .option("pollInterval", {
    alias: "pi",
    type: "number",
    description: "Polling interval in milliseconds (default: 60000 ms)",
    default: 60000,
  })
  .help()
  .alias("help", "h")
  .parseSync();

async function main() {
  try {
    console.log("Launching token...");

    // Launch token and get mint Keypair
    const mintKeypair = await launchToken(argv.privateKey, argv.name, argv.symbol, argv.uri);

    // Extract mint address as a string
    const mintAddress = mintKeypair.publicKey.toString();
    console.log(`Token launched successfully! Mint Address: ${mintAddress}`);

    // Start monitoring and auto-selling
    console.log(`Monitoring token market cap for auto-sell at threshold: ${argv.marketCap}`);
    monitorAndAutoSell(
      argv.privateKey,
      mintAddress,
      argv.marketCap,
      argv.slippage,
      argv.pollInterval,
    );
  } catch (error) {
    console.error("Error in CLI execution:", error);
  }
}

main();
