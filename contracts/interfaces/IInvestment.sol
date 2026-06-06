// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IInvestment {
    function invest() external payable;
    function getInvestor(address user) external view returns (uint256, uint256, uint256, uint256);
    function distributeReturns(address investor, uint256 amount) external;
    function withdrawReturns() external;
    function getTotalStats() external view returns (uint256, uint256, uint256);
}
