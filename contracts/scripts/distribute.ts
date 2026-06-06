import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const APR_BPS = 1140n;
const BPS_DENOM = 10_000n;
const SECONDS_PER_YEAR = BigInt(365 * 24 * 60 * 60);

async function calculateReturns(principal: bigint, elapsedSeconds: bigint): Promise<bigint> {
  return (principal * APR_BPS * elapsedSeconds) / (SECONDS_PER_YEAR * BPS_DENOM);
}

async function main() {
  const [owner] = await ethers.getSigners();

  const { address } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../deployment.json"), "utf8")
  );

  const contract = await ethers.getContractAt("Investment", address, owner);

  const ownerAddress = await contract.owner();
  if (ownerAddress.toLowerCase() !== owner.address.toLowerCase()) {
    throw new Error(`Signer ${owner.address} is not the contract owner (${ownerAddress})`);
  }

  const investorCount = await contract.getInvestorCount();
  if (investorCount === 0n) {
    console.log("No investors found.");
    return;
  }

  console.log(`Owner:     ${owner.address}`);
  console.log(`Contract:  ${address}`);
  console.log(`Investors: ${investorCount}\n`);

  const contractBalance = await ethers.provider.getBalance(address);
  console.log(`Contract balance: ${ethers.formatEther(contractBalance)} ETH`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const investorAddrs: string[]  = [];
  const amounts: bigint[]        = [];
  let totalToDistribute = 0n;

  for (let i = 0n; i < investorCount; i++) {
    const investorAddr = await contract.investorList(i);
    const [invested, , , lastTime] = await contract.getInvestor(investorAddr);

    if (invested === 0n) continue;

    const elapsed = now - lastTime;
    const returns = await calculateReturns(invested, elapsed);

    if (returns > 0n) {
      investorAddrs.push(investorAddr);
      amounts.push(returns);
      totalToDistribute += returns;

      console.log(`${investorAddr}: ${ethers.formatEther(invested)} invested → ${ethers.formatEther(returns)} returns`);
    }
  }

  if (investorAddrs.length === 0) {
    console.log("\nNo returns to distribute.");
    return;
  }

  console.log(`\nTotal to distribute: ${ethers.formatEther(totalToDistribute)} ETH`);

  if (contractBalance < totalToDistribute) {
    throw new Error(
      `Insufficient balance. Need ${ethers.formatEther(totalToDistribute)} ETH, have ${ethers.formatEther(contractBalance)} ETH.\n` +
      `Fund the contract first: npx hardhat run scripts/fund.ts --network <network>`
    );
  }

  const BATCH_SIZE = 50;
  let distributed = 0;

  for (let i = 0; i < investorAddrs.length; i += BATCH_SIZE) {
    const batchAddrs   = investorAddrs.slice(i, i + BATCH_SIZE);
    const batchAmounts = amounts.slice(i, i + BATCH_SIZE);

    const tx = await contract.distributeReturnsBatch(batchAddrs, batchAmounts);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1} tx: ${tx.hash}`);

    const receipt = await tx.wait(1);
    console.log(`Confirmed in block ${receipt?.blockNumber}, gas: ${receipt?.gasUsed.toLocaleString()}`);
    distributed += batchAddrs.length;
  }

  console.log(`\nDistributed to ${distributed} investors.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
