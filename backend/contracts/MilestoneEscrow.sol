// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MilestoneEscrow {
    struct Milestone {
        uint256 id;
        address client;
        address engineer;
        string title;
        uint256 amount;
        bool approved;
        bool released;
        uint256 createdAt;
        uint256 releasedAt;
    }

    uint256 public nextMilestoneId;
    mapping(uint256 => Milestone) public milestones;

    event MilestoneCreated(uint256 indexed milestoneId, address indexed client, address indexed engineer, uint256 amount, string title);
    event MilestoneApproved(uint256 indexed milestoneId, address indexed approver);
    event MilestoneReleased(uint256 indexed milestoneId, address indexed engineer, uint256 amount);

    function createMilestone(address engineer, string calldata title) external payable returns (uint256 milestoneId) {
        require(engineer != address(0), "Invalid engineer");
        require(msg.value > 0, "Amount must be greater than zero");

        milestoneId = nextMilestoneId;
        milestones[milestoneId] = Milestone({
            id: milestoneId,
            client: msg.sender,
            engineer: engineer,
            title: title,
            amount: msg.value,
            approved: false,
            released: false,
            createdAt: block.timestamp,
            releasedAt: 0
        });

        nextMilestoneId += 1;
        emit MilestoneCreated(milestoneId, msg.sender, engineer, msg.value, title);
    }

    function approveMilestone(uint256 milestoneId) external {
        Milestone storage milestone = milestones[milestoneId];
        require(milestone.client != address(0), "Milestone not found");
        require(msg.sender == milestone.client, "Only client can approve");
        require(!milestone.released, "Milestone already released");

        milestone.approved = true;
        emit MilestoneApproved(milestoneId, msg.sender);
    }

    function releaseMilestone(uint256 milestoneId) external {
        Milestone storage milestone = milestones[milestoneId];
        require(milestone.client != address(0), "Milestone not found");
        require(msg.sender == milestone.client, "Only client can release");
        require(milestone.approved, "Milestone not approved");
        require(!milestone.released, "Milestone already released");

        milestone.released = true;
        milestone.releasedAt = block.timestamp;
        payable(milestone.engineer).transfer(milestone.amount);

        emit MilestoneReleased(milestoneId, milestone.engineer, milestone.amount);
    }
}
