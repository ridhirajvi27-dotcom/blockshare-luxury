// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IBlockShare.sol";

contract Rent is Ownable, ReentrancyGuard {

    IBlockShare public blockShare;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public platformFeePercent = 250;

    struct RentalInfo {
        uint256 monthlyRent;
        bool isActive;
    }
    
    mapping(uint256 => mapping(uint256 => RentalInfo)) public rentalSettings;
    mapping(uint256 => mapping(address => uint256)) public lastPaidTimestamp;
    mapping(uint256 => mapping(uint256 => uint256)) private flatCounter;

    event RentSet(uint256 indexed buildingId, uint256 numBHK, uint256 monthlyRent);
    event RentPaid(uint256 indexed buildingId, address indexed tenant, uint256 numBHK, uint256 amount);

    constructor(address _blockShare) Ownable(msg.sender) {
    blockShare = IBlockShare(_blockShare);
}

    modifier onlyBuildingOwner(uint256 buildingId) {
        (, address owner, , , , ,) = blockShare.buildings(buildingId);
        require(owner != address(0), "Invalid building");
        require(msg.sender == owner, "Not building owner");
        _;
    }

    // ---------------- OWNER FUNCTIONS ----------------

    function setRent(
        uint256 buildingId,
        uint256 numBHK,
        uint256 monthlyRent
    ) external onlyBuildingOwner(buildingId) {
        require(monthlyRent > 0, "Invalid rent");

        rentalSettings[buildingId][numBHK] = RentalInfo({
            monthlyRent: monthlyRent,
            isActive: true
        });

        emit RentSet(buildingId, numBHK, monthlyRent);
    }

    function updateRent(
        uint256 buildingId,
        uint256 numBHK,
        uint256 newMonthlyRent
    ) external onlyBuildingOwner(buildingId) {
        require(rentalSettings[buildingId][numBHK].isActive, "Inactive");

        rentalSettings[buildingId][numBHK].monthlyRent = newMonthlyRent;

        emit RentSet(buildingId, numBHK, newMonthlyRent);
    }

    function toggleRentActive(
        uint256 buildingId,
        uint256 numBHK,
        bool active
    ) external onlyBuildingOwner(buildingId) {
        rentalSettings[buildingId][numBHK].isActive = active;
    }

    // ---------------- TENANT FUNCTION ----------------

    function payMonthlyRent(uint256 buildingId, uint256 numBHK)
        external
        payable
        nonReentrant
    {
        uint256 totAmount;

        // Fetch building data via interface
        (, address owner, , , uint256 totTokens, ,) = blockShare.buildings(buildingId);

        require(owner != address(0), "Invalid building");

        RentalInfo storage rental = rentalSettings[buildingId][numBHK];

        require(rental.isActive, "Rent inactive");
        require(msg.value == rental.monthlyRent, "Wrong rent");

        require(
            flatCounter[buildingId][numBHK] <
                blockShare.noOfFlatsByBHK(buildingId, numBHK),
            "No flats left"
        );

        require(
            block.timestamp >= lastPaidTimestamp[buildingId][msg.sender] + 30 days,
            "Already paid"
        );

        require(totTokens > 0, "No holders");

        lastPaidTimestamp[buildingId][msg.sender] = block.timestamp;
        flatCounter[buildingId][numBHK]++;

        emit RentPaid(buildingId, msg.sender, numBHK, rental.monthlyRent);

        // 🔁 Distribute rent to token holders
        address[] memory holders = blockShare.getShareholders(buildingId);

        for (uint256 i = 0; i < holders.length; i++) {
            address user = holders[i];

            uint256 userTokens = blockShare.balanceOf(user, buildingId);
            uint256 amount = (userTokens * rental.monthlyRent) / totTokens;

            if (amount > 0) {
                totAmount += amount;
                (bool success,) = payable(user).call{value: amount}("");
            }
        }

        // Remaining goes to building owner
        (bool success,)=payable(owner).call{value: rental.monthlyRent - totAmount}("");
        require(success, "Transfer to holder failed");
    }

    // ---------------- VIEW ----------------

    function getRentalInfo(uint256 buildingId, uint256 numBHK)
        external
        view
        returns (uint256 monthlyRent, bool active)
    {
        RentalInfo memory r = rentalSettings[buildingId][numBHK];
        return (r.monthlyRent, r.isActive);
    }
}