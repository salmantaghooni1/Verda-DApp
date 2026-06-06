import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [signer] = await ethers.getSigners();

  const { address } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../deployment.json"), "utf8")
  );

  const contract = await ethers.getContractAt("Investment", address, signer);

  const [, returns] = await contract.getInvestor(signer.address);
  if (returns === 0n) {
    console.log("No returns available to withdraw.");
    return;
  }

  console.log(`Investor:  ${signer.address}`);
  console.log(`Returns:   ${ethers.formatEther(returns)} ETH`);
  console.log(`Contract:  ${address}`);

  const contractBalance = await ethers.provider.getBalance(address);
  if (contractBalance < returns) {
    throw new Error(`Contract balance (${ethers.formatEther(contractBalance)} ETH) is insufficient`);
  }

  const tx = await contract.withdrawReturns();
  console.log(`\nTx hash: ${tx.hash}`);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait(1);
  console.log(`Confirmed in block ${receipt?.blockNumber}`);
  console.log(`Gas used: ${receipt?.gasUsed.toLocaleString()}`);
  console.log(`\nWithdrew ${ethers.formatEther(returns)} ETH successfully.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
