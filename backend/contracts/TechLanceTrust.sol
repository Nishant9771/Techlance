// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TechLanceTrust {
    address public owner;

    struct ProofRecord {
        bytes32 hash;
        address registrant;
        uint256 timestamp;
    }

    struct Reputation {
        uint256 ratingSum;
        uint256 ratingCount;
        uint256 completedProjects;
        uint256 trustScore;
        uint256 updatedAt;
    }

    struct Contribution {
        string moduleName;
        address contributor;
        uint256 timestamp;
    }

    mapping(bytes32 => ProofRecord) private ideaProofs;
    mapping(bytes32 => ProofRecord) private ndaProofs;
    mapping(address => Reputation) private reputations;
    mapping(bytes32 => Contribution[]) private contributionsByProject;

    event IdeaRegistered(bytes32 indexed ideaHash, address indexed registrant, uint256 timestamp);
    event NdaRegistered(bytes32 indexed ndaHash, address indexed registrant, uint256 timestamp);
    event ReputationUpdated(address indexed engineer, uint256 averageRating, uint256 completedProjects, uint256 trustScore);
    event ContributionLogged(bytes32 indexed projectId, string moduleName, address indexed contributor, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerIdea(bytes32 ideaHash) external returns (bool) {
        require(ideaHash != bytes32(0), "Invalid hash");
        require(ideaProofs[ideaHash].timestamp == 0, "Idea already registered");

        ideaProofs[ideaHash] = ProofRecord({
            hash: ideaHash,
            registrant: msg.sender,
            timestamp: block.timestamp
        });

        emit IdeaRegistered(ideaHash, msg.sender, block.timestamp);
        return true;
    }

    function getIdeaProof(bytes32 ideaHash) external view returns (address registrant, uint256 timestamp) {
        ProofRecord memory proof = ideaProofs[ideaHash];
        return (proof.registrant, proof.timestamp);
    }

    function registerNda(bytes32 ndaHash) external returns (bool) {
        require(ndaHash != bytes32(0), "Invalid hash");
        require(ndaProofs[ndaHash].timestamp == 0, "NDA already registered");

        ndaProofs[ndaHash] = ProofRecord({
            hash: ndaHash,
            registrant: msg.sender,
            timestamp: block.timestamp
        });

        emit NdaRegistered(ndaHash, msg.sender, block.timestamp);
        return true;
    }

    function getNdaProof(bytes32 ndaHash) external view returns (address registrant, uint256 timestamp) {
        ProofRecord memory proof = ndaProofs[ndaHash];
        return (proof.registrant, proof.timestamp);
    }

    function updateReputation(address engineer, uint8 rating, uint256 completedProjectsIncrement, uint256 trustScore) external onlyOwner {
        require(engineer != address(0), "Invalid engineer");
        require(rating <= 5, "Rating out of range");
        require(trustScore <= 100, "Trust score out of range");

        Reputation storage profile = reputations[engineer];
        profile.ratingSum += rating;
        profile.ratingCount += 1;
        profile.completedProjects += completedProjectsIncrement;
        profile.trustScore = trustScore;
        profile.updatedAt = block.timestamp;

        uint256 average = profile.ratingCount == 0 ? 0 : (profile.ratingSum * 100) / profile.ratingCount;
        emit ReputationUpdated(engineer, average, profile.completedProjects, profile.trustScore);
    }

    function getReputation(address engineer)
        external
        view
        returns (uint256 averageRatingTimes100, uint256 completedProjects, uint256 trustScore, uint256 updatedAt)
    {
        Reputation memory profile = reputations[engineer];
        uint256 average = profile.ratingCount == 0 ? 0 : (profile.ratingSum * 100) / profile.ratingCount;
        return (average, profile.completedProjects, profile.trustScore, profile.updatedAt);
    }

    function logContribution(bytes32 projectId, string calldata moduleName, address contributor) external onlyOwner {
        require(projectId != bytes32(0), "Invalid project id");
        require(bytes(moduleName).length > 0, "Module required");
        require(contributor != address(0), "Invalid contributor");

        contributionsByProject[projectId].push(Contribution({
            moduleName: moduleName,
            contributor: contributor,
            timestamp: block.timestamp
        }));

        emit ContributionLogged(projectId, moduleName, contributor, block.timestamp);
    }

    function getContributionCount(bytes32 projectId) external view returns (uint256) {
        return contributionsByProject[projectId].length;
    }

    function getContributionByIndex(bytes32 projectId, uint256 index)
        external
        view
        returns (string memory moduleName, address contributor, uint256 timestamp)
    {
        require(index < contributionsByProject[projectId].length, "Index out of bounds");
        Contribution memory row = contributionsByProject[projectId][index];
        return (row.moduleName, row.contributor, row.timestamp);
    }
}
