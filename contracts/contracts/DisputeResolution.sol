// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

library DisputeResolution {
    function challengeWindow(uint8 confidence) internal pure returns (uint256) {
        if (confidence >= 90) {
            return 2 hours;
        } else if (confidence >= 70) {
            return 12 hours;
        } else {
            return 0; // indicates fallback/escalation path
        }
    }
}