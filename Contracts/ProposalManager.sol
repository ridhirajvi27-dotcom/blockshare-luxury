// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;
import {BlockShare} from "./BlockShare.sol";

contract ProposalManager is BlockShare {

    struct Proposal {

        string description;
        uint256 votes;
        uint deadline;
        bool executed;
    
    }

    mapping(address Investors => mapping(uint256 BuildingId => mapping(uint256 ProposalId => bool) )) public hasVoted;
    mapping(uint256 BuildingId => Proposal[]) public proposalsForBuilding;

    function CreateProposal(string memory description, uint256 BuildingId) public {

        require(balanceOf(msg.sender, BuildingId)>0, "only an investor can create a proposal");
        uint deadline = block.timestamp + 7 days;
        proposalsForBuilding[BuildingId].push(Proposal(description, 0, deadline, false));
    
    }

    function Vote(uint256 proposalId, uint256 BuildingId) public {

        Proposal storage proposal = proposalsForBuilding[BuildingId][proposalId];
        require(!hasVoted[msg.sender][BuildingId][proposalId], "You have already voted."); 
        require(block.timestamp < proposal.deadline, "Voting period has ended."); 
        require(balanceOf(msg.sender, BuildingId)>0, "You are not eligible for voting");
        proposal.votes += balanceOf(msg.sender, BuildingId); 
        hasVoted[msg.sender][BuildingId][proposalId] = true; 
    
    }

    function getVotes(uint256 proposalId, uint256 BuildingId) public view returns (uint256) {
        return proposalsForBuilding[BuildingId][proposalId].votes;
    }

    mapping(uint256 proposalId => bool execution) public hasExecuted; 

    function Execution(uint256 proposalId, uint256 BuildingId) public {
        BuildingInfo storage b = buildings[BuildingId];
      
        require(block.timestamp > proposalsForBuilding[BuildingId][proposalId].deadline, "Voting period is not over yet.");
        require(!proposalsForBuilding[BuildingId][proposalId].executed, "Proposal already executed.");
        if(proposalsForBuilding[BuildingId][proposalId].votes > b.totTokens/2) {
            proposalsForBuilding[BuildingId][proposalId].executed = true;

        }
    }
    
    function Proposals(uint256 proposalId, uint256 BuildingId) public view returns (string memory description, uint256 votes, uint256 deadline) {
          return (proposalsForBuilding[BuildingId][proposalId].description, proposalsForBuilding[BuildingId][proposalId].votes, proposalsForBuilding[BuildingId][proposalId].deadline);
    }



}