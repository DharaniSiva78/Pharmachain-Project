// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract QualityToken is ERC20 {
    address public pharmaChainAddress;
    address public owner;
    
    mapping(address => bool) public authorizedMinters;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() ERC20("PharmaChain Quality Token", "PQT") {
        owner = msg.sender;
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    function setPharmaChainAddress(address _pharmaChainAddress) external onlyOwner {
        pharmaChainAddress = _pharmaChainAddress;
        authorizedMinters[_pharmaChainAddress] = true;
    }
    
    function rewardQuality(address _to, uint256 _amount) external onlyAuthorized {
        _mint(_to, _amount);
    }
    
    function addAuthorizedMinter(address _minter) external onlyOwner {
        authorizedMinters[_minter] = true;
    }
}