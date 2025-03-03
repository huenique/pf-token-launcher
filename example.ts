import { launchToken } from "./src/launch";
import { monitorAndAutoSell } from "./src/manager";

class Example {
  private deployerPrivatekey: string;
  private tokenUri: string;
  private tokenSymbol: string;
  private tokenName: string;

  constructor(
    deployerPrivatekey: string,
    tokenUri: string,
    tokenSymbol: string,
    tokenName: string,
  ) {
    this.deployerPrivatekey = deployerPrivatekey;
    this.tokenUri = tokenUri;
    this.tokenSymbol = tokenSymbol;
    this.tokenName = tokenName;
  }

  async main() {
    try {
      // Launch token and capture the mint Keypair.
      const mintKeypair = await launchToken(
        this.deployerPrivatekey,
        this.tokenName,
        this.tokenSymbol,
        this.tokenUri,
      );

      // Extract the public key string from the mint Keypair.
      const mintAddress = mintKeypair.publicKey.toString();
      console.log("Token launched with mint address:", mintAddress);

      // Set auto-sell parameters.
      const marketCapThreshold = 2000000; // Example market cap threshold
      const slippage = 0.25; // 25% slippage (adjust as needed)
      const pollInterval = 60000; // Poll every 60 seconds

      // Start monitoring and auto-sell when threshold is met.
      monitorAndAutoSell(
        this.deployerPrivatekey,
        mintAddress,
        marketCapThreshold,
        slippage,
        pollInterval,
      );
    } catch (error) {
      console.error("Error in main function:", error);
    }
  }
}

// Usage
const deployerPrivatekey = "your_private_key_here";
const tokenUri = "your_token_uri_here";
const tokenSymbol = "your_token_symbol_here";
const tokenName = "your_token_name_here";

const example = new Example(deployerPrivatekey, tokenUri, tokenSymbol, tokenName);
example.main();
