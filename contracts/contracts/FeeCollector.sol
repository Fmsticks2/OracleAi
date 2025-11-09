// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

contract FeeCollector {
    address public treasury;
    uint256 public feeBps; // basis points (0.1% => 10)
    address public owner;

    event FeeUpdated(uint256 feeBps);
    event TreasuryUpdated(address treasury);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _treasury, uint256 _feeBps) {
        require(_treasury != address(0), "treasury required");
        owner = msg.sender;
        treasury = _treasury;
        require(_feeBps <= 10000, "max 100%");
        feeBps = _feeBps;
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 10000, "max 100%");
        feeBps = _feeBps;
        emit FeeUpdated(_feeBps);
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "treasury required");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function computeFee(uint256 volume) public view returns (uint256) {
        return (volume * feeBps) / 10000;
    }
}