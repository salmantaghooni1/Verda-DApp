import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();

  const deploymentPath = path.resolve(__dirname, "../deployment.json");
  if (!fs.existsSync(deploymentPath)) {
    throw new Error("deployment.json not found. Run deploy.ts first.");
  }
  const { address } = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const contract = await ethers.getContractAt("Investment", address, signer);

  const amountEth = process.env.INVEST_AMOUNT || "0.01";
  const value = ethers.parseEther(amountEth);

  const minInvestment = await contract.MIN_INVESTMENT();
  if (value < minInvestment) {
    throw new Error(`Amount ${amountEth} ETH is below minimum ${ethers.formatEther(minInvestment)} ETH`);
  }

  console.log(`Investor:  ${signer.address}`);
  console.log(`Contract:  ${address}`);
  console.log(`Amount:    ${amountEth} ETH`);

  const gasEstimate = await contract.invest.estimateGas({ value });
  console.log(`Est. gas:  ${gasEstimate.toLocaleString()}`);

  const tx = await contract.invest({ value });
  console.log(`Tx hash:   ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait(1);
  console.log(`\nConfirmed in block ${receipt?.blockNumber}`);
  console.log(`Gas used:  ${receipt?.gasUsed.toLocaleString()}`);

  const [invested, returns, count] = await contract.getInvestor(signer.address);
  console.log(`\nPortfolio after:`);
  console.log(`  Invested: ${ethers.formatEther(invested)} ETH`);
  console.log(`  Returns:  ${ethers.formatEther(returns)} ETH`);
  console.log(`  Count:    ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
