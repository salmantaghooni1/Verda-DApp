import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const target = process.env.INVESTOR_ADDRESS;
  if (!target || !ethers.isAddress(target)) {
    throw new Error("Set INVESTOR_ADDRESS env var to a valid Ethereum address");
  }

  const { address } = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../deployment.json"), "utf8")
  );

  const contract = await ethers.getContractAt("Investment", address);

  const [invested, returns, count, lastTime] = await contract.getInvestor(target);
  const accrued = await contract.accruedReturns(target);
  const [tvl, totalInvestors, aprBps] = await contract.getTotalStats();

  const lastDate = new Date(Number(lastTime) * 1000);
  const aprPct   = Number(aprBps) / 100;

  console.log(`\n─── Investor: ${target} ───`);
  console.log(`Invested:       ${ethers.formatEther(invested)} ETH`);
  console.log(`Claimable:      ${ethers.formatEther(returns)} ETH`);
  console.log(`Accrued (live): ${ethers.formatEther(accrued)} ETH`);
  console.log(`Investments:    ${count}`);
  console.log(`Last deposit:   ${lastDate.toLocaleString()}`);

  console.log(`\n─── Protocol ───`);
  console.log(`TVL:            ${ethers.formatEther(tvl)} ETH`);
  console.log(`Total investors: ${totalInvestors}`);
  console.log(`APR:            ${aprPct}%`);
  console.log(`Contract:       ${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
