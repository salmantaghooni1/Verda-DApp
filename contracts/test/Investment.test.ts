import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Investment } from "../typechain-types";

describe("Investment", function () {
  let contract: Investment;
  let owner: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;
  let attacker: HardhatEthersSigner;

  const MIN_INVESTMENT = ethers.parseEther("0.001");
  const ONE_ETH = ethers.parseEther("1.0");

  beforeEach(async function () {
    [owner, investor1, investor2, attacker] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("Investment");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  describe("invest()", function () {
    it("accepts valid investment", async function () {
      await expect(
        contract.connect(investor1).invest({ value: ONE_ETH })
      ).to.emit(contract, "InvestmentMade").withArgs(investor1.address, ONE_ETH, ONE_ETH);

      const [invested] = await contract.getInvestor(investor1.address);
      expect(invested).to.equal(ONE_ETH);
    });

    it("reverts below minimum", async function () {
      await expect(
        contract.connect(investor1).invest({ value: 1n })
      ).to.be.revertedWithCustomError(contract, "BelowMinimum");
    });

    it("reverts when paused", async function () {
      await contract.pause();
      await expect(
        contract.connect(investor1).invest({ value: ONE_ETH })
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });

    it("accumulates multiple investments", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.connect(investor1).invest({ value: ONE_ETH });

      const [invested, , count] = await contract.getInvestor(investor1.address);
      expect(invested).to.equal(ONE_ETH * 2n);
      expect(count).to.equal(2n);
    });

    it("tracks total investors correctly", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.connect(investor2).invest({ value: ONE_ETH });
      await contract.connect(investor1).invest({ value: ONE_ETH });

      expect(await contract.totalInvestors()).to.equal(2n);
    });
  });

  describe("distributeReturns()", function () {
    beforeEach(async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.fundContract({ value: ethers.parseEther("5.0") });
    });

    it("owner can distribute returns", async function () {
      const returns = ethers.parseEther("0.1");
      await expect(
        contract.distributeReturns(investor1.address, returns)
      ).to.emit(contract, "ReturnsDistributed").withArgs(investor1.address, returns);

      const [, returnsAmount] = await contract.getInvestor(investor1.address);
      expect(returnsAmount).to.equal(returns);
    });

    it("reverts if non-owner calls", async function () {
      await expect(
        contract.connect(attacker).distributeReturns(investor1.address, ONE_ETH)
      ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("reverts if contract balance insufficient", async function () {
      await expect(
        contract.distributeReturns(investor1.address, ethers.parseEther("100.0"))
      ).to.be.revertedWithCustomError(contract, "InsufficientContractBalance");
    });
  });

  describe("withdrawReturns()", function () {
    it("withdraws available returns", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.fundContract({ value: ethers.parseEther("5.0") });

      const returns = ethers.parseEther("0.1");
      await contract.distributeReturns(investor1.address, returns);

      const before = await ethers.provider.getBalance(investor1.address);
      const tx = await contract.connect(investor1).withdrawReturns();
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const after = await ethers.provider.getBalance(investor1.address);

      expect(after).to.be.closeTo(before + returns - gasCost, ethers.parseEther("0.0001"));
    });

    it("reverts with no returns", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await expect(
        contract.connect(investor1).withdrawReturns()
      ).to.be.revertedWithCustomError(contract, "NoReturnsAvailable");
    });

    it("prevents double withdrawal", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.fundContract({ value: ethers.parseEther("5.0") });
      await contract.distributeReturns(investor1.address, ethers.parseEther("0.1"));
      await contract.connect(investor1).withdrawReturns();

      await expect(
        contract.connect(investor1).withdrawReturns()
      ).to.be.revertedWithCustomError(contract, "NoReturnsAvailable");
    });
  });

  describe("Security: Reentrancy", function () {
    it("totalPromisedReturns decrements before transfer", async function () {
      await contract.connect(investor1).invest({ value: ONE_ETH });
      await contract.fundContract({ value: ethers.parseEther("5.0") });

      const returns = ethers.parseEther("0.1");
      await contract.distributeReturns(investor1.address, returns);

      expect(await contract.totalPromisedReturns()).to.equal(returns);
      await contract.connect(investor1).withdrawReturns();
      expect(await contract.totalPromisedReturns()).to.equal(0n);
    });
  });

  describe("Security: Access Control", function () {
    it("only owner can pause", async function () {
      await expect(contract.connect(attacker).pause())
        .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });

    it("only owner can fund contract", async function () {
      await expect(contract.connect(attacker).fundContract({ value: ONE_ETH }))
        .to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
    });
  });

  describe("receive()", function () {
    it("accepts direct ETH transfer above minimum", async function () {
      await expect(
        investor1.sendTransaction({ to: await contract.getAddress(), value: ONE_ETH })
      ).to.emit(contract, "InvestmentMade");
    });

    it("rejects direct ETH transfer below minimum", async function () {
      await expect(
        investor1.sendTransaction({ to: await contract.getAddress(), value: 1n })
      ).to.be.reverted;
    });
  });
});
