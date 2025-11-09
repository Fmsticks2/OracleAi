// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import "./DisputeResolution.sol";

contract OracleRegistry {
    using DisputeResolution for uint8;

    enum Outcome { Yes, No, Invalid }

    struct Market {
        bool exists;
        bytes32 idHash;
        string eventDescription;
        string resolutionCriteria;
        bool finalized;
        Outcome outcome;
        uint8 confidence;
        bytes32 proofHash;
        uint256 registeredAt;
        uint256 resolutionSubmittedAt;
        uint256 challengeDeadline;
    }

    mapping(bytes32 => Market) public markets;
    uint256 public stakingMinimumWei = 1 ether; // 1 BNB equivalent
    address public owner;

    event MarketRegistered(bytes32 indexed idHash, string marketId, string eventDescription);
    event ResolutionSubmitted(bytes32 indexed idHash, Outcome outcome, uint8 confidence, bytes32 proofHash, uint256 challengeDeadline);
    event ResolutionChallenged(bytes32 indexed idHash, address challenger, uint256 stake);
    event ResolutionFinalized(bytes32 indexed idHash, Outcome outcome);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setStakingMinimumWei(uint256 weiAmount) external onlyOwner {
        require(weiAmount > 0, "min > 0");
        stakingMinimumWei = weiAmount;
    }

    function registerMarket(
        string calldata marketId,
        string calldata eventDescription,
        string calldata resolutionCriteria
    ) external returns (bytes32 idHash) {
        idHash = keccak256(bytes(marketId));
        require(!markets[idHash].exists, "market exists");

        markets[idHash] = Market({
            exists: true,
            idHash: idHash,
            eventDescription: eventDescription,
            resolutionCriteria: resolutionCriteria,
            finalized: false,
            outcome: Outcome.Invalid,
            confidence: 0,
            proofHash: bytes32(0),
            registeredAt: block.timestamp,
            resolutionSubmittedAt: 0,
            challengeDeadline: 0
        });

        emit MarketRegistered(idHash, marketId, eventDescription);
    }

    function submitResolution(
        string calldata marketId,
        Outcome outcome,
        uint8 confidenceScore,
        bytes32 proofHash
    ) external {
        bytes32 idHash = keccak256(bytes(marketId));
        Market storage m = markets[idHash];
        require(m.exists, "unknown market");
        require(!m.finalized, "already finalized");
        require(confidenceScore <= 100, "confidence 0-100");

        m.outcome = outcome;
        m.confidence = confidenceScore;
        m.proofHash = proofHash;
        m.resolutionSubmittedAt = block.timestamp;

        uint256 window = confidenceScore.challengeWindow();
        if (window == 0) {
            // Low confidence indicates fallback/escalation path (UMA OO or human)
            m.challengeDeadline = 0;
        } else {
            m.challengeDeadline = block.timestamp + window;
        }

        emit ResolutionSubmitted(idHash, outcome, confidenceScore, proofHash, m.challengeDeadline);
    }

    function challengeResolution(string calldata marketId) external payable {
        bytes32 idHash = keccak256(bytes(marketId));
        Market storage m = markets[idHash];
        require(m.exists, "unknown market");
        require(m.resolutionSubmittedAt > 0, "no resolution");
        require(m.challengeDeadline == 0 || block.timestamp < m.challengeDeadline, "window closed");
        require(msg.value >= stakingMinimumWei, "stake too low");

        emit ResolutionChallenged(idHash, msg.sender, msg.value);
    }

    function finalizeResolution(string calldata marketId) external {
        bytes32 idHash = keccak256(bytes(marketId));
        Market storage m = markets[idHash];
        require(m.exists, "unknown market");
        require(!m.finalized, "already finalized");
        require(m.resolutionSubmittedAt > 0, "no resolution");
        if (m.challengeDeadline != 0) {
            require(block.timestamp >= m.challengeDeadline, "challenge window open");
        }
        m.finalized = true;
        emit ResolutionFinalized(idHash, m.outcome);
    }
}