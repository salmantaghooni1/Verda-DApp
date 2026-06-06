import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

const CONFIRMATIONS_BEFORE_VERIFY = 5;

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} ETH\n`);

  console.log("Deploying Investment contract...");
  const Investment = await ethers.getContractFactory("Investment");
  const contract   = await Investment.deploy();
  const deployTx   = contract.deploymentTransaction();

  if (!deployTx) throw new Error("No deployment transaction found");

  console.log(`Tx hash: ${deployTx.hash}`);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const receipt = await deployTx.wait(1);

  console.log(`\nDeployed at: ${address}`);
  console.log(`Block:       ${receipt?.blockNumber}`);
  console.log(`Gas used:    ${receipt?.gasUsed.toLocaleString()}`);

  const deployment = {
    address,
    network:   network.name,
    chainId:   (await ethers.provider.getNetwork()).chainId.toString(),
    deployer:  deployer.address,
    txHash:    deployTx.hash,
    block:     receipt?.blockNumber,
    gasUsed:   receipt?.gasUsed.toString(),
    timestamp: new Date().toISOString(),
    abi: JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../artifacts/contracts/Investment.sol/Investment.json"), "utf8")
    ).abi,
  };

  const outPath = path.resolve(__dirname, "../deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deployment, null, 2));
  console.log(`\nDeployment config saved → ${outPath}`);

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`\nWaiting ${CONFIRMATIONS_BEFORE_VERIFY} confirmations before verifying...`);
    await deployTx.wait(CONFIRMATIONS_BEFORE_VERIFY);

    try {
      await run("verify:verify", {
        address,
        constructorArguments: [],
      });
      console.log("Contract verified on Etherscan");
    } catch (err: unknown) {
      const e = err as { message?: string };
      if (e.message?.includes("Already Verified")) {
        console.log("Already verified");
      } else {
        console.warn("Verification failed:", e.message);
      }
    }
  }

  return address;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
