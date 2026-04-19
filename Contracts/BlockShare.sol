// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

contract BlockShare is ERC1155, Ownable, ReentrancyGuard, ERC1155Holder {

    uint256 public BuildingCount; 
    address public pool;

    struct BuildingInfo {
    uint256 id;
    address owner;
    string description;
    uint256 price;
    //uint256 tokenEquity; 
    //uint256 tokenPrice;
    uint256 totTokens; 
    //uint256 tokensSold;
    uint256 ethReserves;   
    uint256 tokenReserves; 
}
    struct FlatInfo {
            uint256 BuildingId;
            uint256 numBHK;
            uint256 numFlats;
            uint256 rentPerFlat;
        }

struct BuildingRequest {
    address requester;
    string name;
    string description;
    uint256 price;
    uint256 tokenEquity;
    uint256 valueSent;
    bool approved;
    bool rejected;
}

uint256 public requestCount;
mapping(uint256 => BuildingRequest) public requests;

    mapping(uint256 => BuildingInfo) public buildings;
    mapping(uint256 => FlatInfo[]) public flats;
    mapping(uint256 BuildingId => address[]) public buildingShareHolders; 
    mapping(uint256 BuildingId => mapping(uint256 numBHK => uint256 noOfFlats )) public noOfFlatsByBHK; 
    mapping(address => mapping(uint256 => bool)) public isShareHolder;

    event BuildingAdded(uint256 buildingId, address owner, string name);
    //event TokenSplit(uint256 tokenEquity, uint256 tokenPrice);
    event SetBuildingPrice(uint256 buildingId, uint256 price/*,  uint256 tokenPrice*/);
    event FlatsAdded( uint256 buildingId, uint256 numBHK);
    event BuildingRequested(uint256 requestId, address requester);


    constructor() ERC1155("") Ownable(msg.sender) {}

    function requestBuilding (
    string memory _name,
    string memory _description,
    uint256 _price,
    uint256 _tokenEquity
) public payable returns (uint256) {

    require(msg.value == 0.000001 ether, "Must send 1 ether");
    require(_tokenEquity > 0 && _tokenEquity <= 1e6, "Invalid equity");
    require(1e6 % _tokenEquity == 0, "Must divide 1e6 exactly");
    require(_price > 0, "Price must be greater than zero");

    requestCount++;

    requests[requestCount] = BuildingRequest({
        requester: msg.sender,
        name: _name,
        description: _description,
        price: _price,
        tokenEquity: _tokenEquity,
        valueSent: msg.value,
        approved: false,
        rejected: false

        
    });

    emit BuildingRequested(requestCount, msg.sender);
    return requestCount;
}

function approveBuilding(uint256 requestId) public onlyOwner {
    require(requestId > 0 && requestId <= requestCount, "Invalid requestId");

    BuildingRequest storage r = requests[requestId];

    require(r.requester != address(0), "Request does not exist");
    require(!r.approved, "Already approved");
    require(!r.rejected, "Already rejected");

    r.approved = true;

    BuildingCount++;

    BuildingInfo storage b = buildings[BuildingCount];

    b.description = r.description;
    b.price = r.price;
    b.id = BuildingCount;
    b.owner = r.requester;
    //b.tokenEquity = r.tokenEquity;

   // b.tokenPrice = (r.price * r.tokenEquity) / 1e6;
    b.totTokens = 1e6 / r.tokenEquity;

    emit BuildingAdded(BuildingCount, r.requester, r.name);
}

function rejectBuilding(uint256 requestId) public onlyOwner {
    require(requestId > 0 && requestId <= requestCount, "Invalid requestId");

    BuildingRequest storage r = requests[requestId];

    require(r.requester != address(0), "Request does not exist");
    require(!r.approved, "Already approved");
    require(!r.rejected, "Already rejected");

    r.rejected = true;

    uint256 refund = r.valueSent;
    r.valueSent = 0;

    (bool success, ) = payable(r.requester).call{value: refund}("");
    require(success, "Refund failed");
}

    function addFlat(
            uint256 _buildingId,
            uint256 numBHK,
            uint256 numFlats,
            uint256 rentPerFlat) public  {
        BuildingInfo storage b = buildings[_buildingId];
        
        require(b.owner != address(0), "Building does not exist");
        require(msg.sender == b.owner, "Only owner can add flats");

        noOfFlatsByBHK[_buildingId][numBHK] = numFlats;
        
        flats[_buildingId].push(
            FlatInfo({
                BuildingId: _buildingId,
                numBHK: numBHK,
                numFlats: numFlats,
                rentPerFlat: rentPerFlat
            })
        );


        emit FlatsAdded( _buildingId, numBHK);
    }

    function seedLiquidity(uint256 _id) external payable nonReentrant {
    BuildingInfo storage b = buildings[_id];
    require(msg.sender == b.owner, "Only owner can seed");
    require(b.tokenReserves == 0, "Pool already seeded");
    require(msg.value > 0, "Must pitch ETH for pool");

    uint256 ownerShare = (b.totTokens*5)/10000; // 0.05% of total tokens (5/10000) 
    uint256 poolShare = b.totTokens - ownerShare;

    // Mint owner's 0.05% to their wallet
    _mint(b.owner, _id, ownerShare, "");
    
    // Mint the rest to the contract for the AMM pool
    _mint(address(this), _id, poolShare, "");

    b.tokenReserves = poolShare;
    b.ethReserves = msg.value;
    //b.tokensSold = b.totTokens;
    
    
}

function swap(uint256 _id, uint256 _tokenAmountIn, bool _isBuy) external payable nonReentrant {
    BuildingInfo storage b = buildings[_id];
    require(b.ethReserves > 0 && b.tokenReserves > 0);

    if (!isShareHolder[msg.sender][_id]) {
        buildingShareHolders[_id].push(msg.sender);
        isShareHolder[msg.sender][_id] = true;
    }

    uint256 ethRes = b.ethReserves;
    uint256 tokenRes = b.tokenReserves;

    if (_isBuy) {
        uint256 amountInWithFee = (msg.value * 997) / 1000;
        uint256 tokensOut = (amountInWithFee * tokenRes) / (ethRes + amountInWithFee);

        require(tokensOut > 0 && tokensOut <= 500);

        b.ethReserves = ethRes + msg.value;
        b.tokenReserves = tokenRes - tokensOut;

        _safeTransferFrom(address(this), msg.sender, _id, tokensOut, "");
    } else {
        require(_tokenAmountIn > 0 && _tokenAmountIn <= 500);

        uint256 amountInWithFee = (_tokenAmountIn * 997) / 1000;
        uint256 ethOut = (amountInWithFee * ethRes) / (tokenRes + amountInWithFee);

        require(ethOut > 0);

        b.tokenReserves = tokenRes + _tokenAmountIn;
        b.ethReserves = ethRes - ethOut;

        _safeTransferFrom(msg.sender, address(this), _id, _tokenAmountIn, "");

        (bool success, ) = payable(msg.sender).call{value: ethOut}("");
        require(success);
    }
}

function getTokenPrice(uint256 _id) public view returns (uint256) {
    BuildingInfo storage b = buildings[_id];
    require(b.tokenReserves > 0, "Pool not seeded");
    return (b.ethReserves * 1e18) / b.tokenReserves; // price in wei per token
}
   

    function setBuildingPrice(uint256 id, uint256 price) public {
        BuildingInfo storage b = buildings[id];
        require(b.owner != address(0), "Building does not exist");
        require(msg.sender == b.owner, "Only owner is allowed to set price");
        require(price != 0, "Price cannot be zero");

        b.price = price;
        //b.tokenPrice = ((price)*(b.tokenEquity))/1000000;

        emit SetBuildingPrice(id, price /*, b.tokenPrice*/);
    }

    function getShareholders(uint256 buildingId) public view returns (address[] memory) {
    return buildingShareHolders[buildingId];
}

function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC1155Holder)  // ← tell solidity which two to merge
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function withdrawETH() public onlyOwner{

        (bool callSuccess,) = payable(msg.sender).call{value: address(this).balance}("");
        require(callSuccess, "Call failed");
   }
}