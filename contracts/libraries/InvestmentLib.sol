// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library InvestmentLib {
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant APR_DENOMINATOR   = 10_000;

    function calculateAccruedReturns(
        uint256 principal,
        uint256 aprBps,
        uint256 elapsedSeconds
    ) internal pure returns (uint256) {
        if (principal == 0 || aprBps == 0 || elapsedSeconds == 0) return 0;
        return (principal * aprBps * elapsedSeconds) / (SECONDS_PER_YEAR * APR_DENOMINATOR);
    }

    function isValidAddress(address addr) internal pure returns (bool) {
        return addr != address(0);
    }

    function toWei(uint256 ether_) internal pure returns (uint256) {
        return ether_ * 1 ether;
    }
}
