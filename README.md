# pf-token-launcher

This repository provides tools and scripts for programmatically launching `pump.fun` tokens. The project is set up using TypeScript and includes essential modules to facilitate token creation and management.

- Programmatically launch `pump.fun` tokens.
- Utilities for managing token configurations.
- Easy integration into existing projects.

## Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14 or later)
- [npm](https://www.npmjs.com/)
- [TypeScript](https://www.typescriptlang.org/)

## Installation

To install the package, clone the repository and install the dependencies:

```bash
git clone https://github.com/bilix-software/pf-token-launcher.git
cd pf-token-launcher
npm install
```

## Usage

To compile and run the scripts:

1. Configure your environment variables as instructed.

2. Compile the TypeScript files, `npx tsc`

3. Run the compiled JavaScript file:

```bash
node example.js
```

### **Solana Pump.fun Token Launcher & Auto-Sell CLI** (`src/cli.ts`)

The CLI tool allows you to **launch a token on Solana** and automatically **sell your share of the tokens** once the token reaches a specific market cap. It integrates with **pump.fun** and helps automate the trading process.

#### **How It Works**

1. **Launch a token** using your deployer private key, token name, symbol, and metadata URI.
2. **Monitor the token's market cap** in real-time.
3. **Automatically sell** your share of the tokens when the market cap reaches your target.

#### **CLI Parameters & Their Meanings**

| **Flag**         | **Alias** | **Type** | **Description**                                                                                                                                                |
| ---------------- | --------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--privateKey`   | `-p`      | string   | Your **base58-encoded private key** for deploying the token. **(Required)**                                                                                    |
| `--uri`          | `-u`      | string   | The **metadata URI** for your token (image, description, etc.). **(Required)**                                                                                 |
| `--symbol`       | `-s`      | string   | The **symbol** of your token (e.g., `"PUMP"`). **(Required)**                                                                                                  |
| `--name`         | `-n`      | string   | The **name** of your token (e.g., `"PumpToken"`). **(Required)**                                                                                               |
| `--marketCap`    | `-m`      | number   | The **market cap threshold** at which your tokens will be **automatically sold**. **(Required)**                                                               |
| `--slippage`     | `-sl`     | number   | **Slippage tolerance** as a decimal fraction (default: `0.25` = 25%). Determines how much price movement you’re willing to accept before the sell order fails. |
| `--pollInterval` | `-pi`     | number   | **Time interval (in milliseconds)** to check the market cap (default: `60000ms` = 1 minute).                                                                   |

#### **Example Usage**

Run the following command in your terminal:

```sh
node cli.ts \
  --privateKey "your_base58_private_key" \
  --uri "your_token_metadata_uri" \
  --symbol "SYM" \
  --name "TokenName" \
  --marketCap 2000000 \
  --slippage 0.1 \
  --pollInterval 30000
```

**Example Breakdown:**

- **Launches a token** with the provided name, symbol, and metadata.
- **Monitors its market cap** every **30 seconds**.
- **Automatically sells** your tokens once the market cap reaches **$2,000,000**.
- **Allows up to 10% slippage** (meaning you accept a 10% lower price than expected before canceling the trade).

#### **What is Slippage?**

**Slippage** refers to the difference between the **expected price** of your trade and the **actual price** you receive.

- **Lower slippage (e.g., 0.01 or 1%)** → You get a better price, but your trade may fail if the price moves.
- **Higher slippage (e.g., 0.25 or 25%)** → Your trade is more likely to execute, but you might get a worse price.
- **Default is 0.25 (25%)**, meaning you accept a price drop of up to 25% to ensure the trade completes.
