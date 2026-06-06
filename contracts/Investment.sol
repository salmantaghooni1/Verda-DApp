// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/InvestmentLib.sol";

contract Investment is ReentrancyGuard, Pausable, Ownable {
    using InvestmentLib for uint256;

    uint256 public constant MIN_INVESTMENT = 0.001 ether;
    uint256 public constant APR_BPS = 1140;

    struct InvestorData {
        uint256 investedAmount;
        uint256 returnsAmount;
        uint256 investmentCount;
        uint256 lastInvestmentTime;
        bool    exists;
    }

    uint256 public totalInvested;
    uint256 public totalInvestors;
    uint256 public totalPromisedReturns;

    mapping(address => InvestorData) public investors;
    address[] public investorList;

    event InvestmentMade(address indexed investor, uint256 amount, uint256 totalInvestedAfter);
    event ReturnsDistributed(address indexed investor, uint256 amount);
    event ReturnsWithdrawn(address indexed investor, uint256 amount);
    event ContractFunded(address indexed funder, uint256 amount);
    event EmergencyStop(address indexed triggeredBy);

    error BelowMinimum(uint256 sent, uint256 minimum);
    error InvestorNotFound(address addr);
    error InsufficientContractBalance(uint256 available, uint256 required);
    error BatchTooLarge(uint256 length, uint256 max);
    error ArrayLengthMismatch();
    error NoReturnsAvailable();
    error TransferFailed();
    error ZeroAmount();

    constructor() Ownable(msg.sender) {}

    function invest() external payable nonReentrant whenNotPaused {
        if (msg.value < MIN_INVESTMENT) revert BelowMinimum(msg.value, MIN_INVESTMENT);
        _processInvestment();
    }

    function _processInvestment() private {
        if (!investors[msg.sender].exists) {
            investors[msg.sender].exists = true;
            investorList.push(msg.sender);
            unchecked { totalInvestors++; }
        }

        unchecked {
            investors[msg.sender].investedAmount += msg.value;
            investors[msg.sender].investmentCount++;
            totalInvested += msg.value;
        }
        investors[msg.sender].lastInvestmentTime = block.timestamp;

        emit InvestmentMade(msg.sender, msg.value, totalInvested);
    }

    function getInvestor(address user) external view returns (
        uint256 investedAmount,
        uint256 returnsAmount,
        uint256 investmentCount,
        uint256 lastInvestmentTime
    ) {
        if (!investors[user].exists) revert InvestorNotFound(user);
        InvestorData storage inv = investors[user];
        return (inv.investedAmount, inv.returnsAmount, inv.investmentCount, inv.lastInvestmentTime);
    }

    function accruedReturns(address user) external view returns (uint256) {
        if (!investors[user].exists) return 0;
        InvestorData storage inv = investors[user];
        uint256 elapsed = block.timestamp - inv.lastInvestmentTime;
        return InvestmentLib.calculateAccruedReturns(inv.investedAmount, APR_BPS, elapsed);
    }

    function distributeReturns(address investor, uint256 amount) external onlyOwner nonReentrant {
        if (!investors[investor].exists) revert InvestorNotFound(investor);
        if (amount == 0) revert ZeroAmount();

        uint256 available = address(this).balance;
        uint256 required  = totalPromisedReturns + amount;
        if (available < required) revert InsufficientContractBalance(available, required);

        unchecked {
            investors[investor].returnsAmount += amount;
            totalPromisedReturns += amount;
        }

        emit ReturnsDistributed(investor, amount);
    }

    function distributeReturnsBatch(
        address[] calldata investorAddrs,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant {
        if (investorAddrs.length != amounts.length) revert ArrayLengthMismatch();
        if (investorAddrs.length > 200) revert BatchTooLarge(investorAddrs.length, 200);

        uint256 totalBatch;
        for (uint256 i; i < amounts.length;) {
            unchecked { totalBatch += amounts[i]; i++; }
        }

        uint256 available = address(this).balance;
        uint256 required  = totalPromisedReturns + totalBatch;
        if (available < required) revert InsufficientContractBalance(available, required);

        for (uint256 i; i < investorAddrs.length;) {
            address inv = investorAddrs[i];
            uint256 amt = amounts[i];
            if (investors[inv].exists && amt > 0) {
                unchecked {
                    investors[inv].returnsAmount += amt;
                    totalPromisedReturns         += amt;
                }
                emit ReturnsDistributed(inv, amt);
            }
            unchecked { i++; }
        }
    }

    function withdrawReturns() external nonReentrant whenNotPaused {
        if (!investors[msg.sender].exists) revert InvestorNotFound(msg.sender);

        uint256 amount = investors[msg.sender].returnsAmount;
        if (amount == 0) revert NoReturnsAvailable();

        investors[msg.sender].returnsAmount = 0;
        unchecked { totalPromisedReturns -= amount; }

        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit ReturnsWithdrawn(msg.sender, amount);
    }

    function fundContract() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit ContractFunded(msg.sender, msg.value);
    }

    function pause() external onlyOwner {
        _pause();
        emit EmergencyStop(msg.sender);
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getTotalStats() external view returns (
        uint256 invested,
        uint256 numInvestors,
        uint256 aprBps
    ) {
        return (totalInvested, totalInvestors, APR_BPS);
    }

    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function getInvestorCount() external view returns (uint256) {
        return investorList.length;
    }

    receive() external payable {
        if (msg.value < MIN_INVESTMENT) revert BelowMinimum(msg.value, MIN_INVESTMENT);
        _processInvestment();
    }
}
