// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PharmaChain {
    struct Batch {
        string batchId;
        string drugName;
        string manufacturer;
        string origin;
        uint256 manufactureDate;
        uint256 expiryDate;
        bool expired;
        bool spoiled;
        string spoilReason;
        string certificateHash;
        address currentHolder;
    }
    
    mapping(string => Batch) public batches;
    mapping(string => bool) public batchExists;
    address public owner;
    
    event BatchRegistered(string batchId, string drugName, address holder);
    event BatchTransferred(string batchId, address from, address to);
    event BatchSpoiled(string batchId, string reason);
    event BatchExpired(string batchId);
    event CertificateUpdated(string batchId, string newHash);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier batchExistsCheck(string memory _batchId) {
        require(batchExists[_batchId], "Batch does not exist");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function registerBatch(
        string memory _batchId,
        string memory _drugName,
        string memory _manufacturer,
        string memory _origin,
        uint256 _manufactureDate,
        uint256 _expiryDate,
        string memory _certificateHash
    ) external {
        require(!batchExists[_batchId], "Batch already exists");
        require(_expiryDate > block.timestamp, "Expiry date must be in future");
        
        batches[_batchId] = Batch({
            batchId: _batchId,
            drugName: _drugName,
            manufacturer: _manufacturer,
            origin: _origin,
            manufactureDate: _manufactureDate,
            expiryDate: _expiryDate,
            expired: false,
            spoiled: false,
            spoilReason: "",
            certificateHash: _certificateHash,
            currentHolder: msg.sender
        });
        
        batchExists[_batchId] = true;
        emit BatchRegistered(_batchId, _drugName, msg.sender);
    }
    
    function transferBatch(string memory _batchId, address _to) 
        external 
        batchExistsCheck(_batchId) 
    {
        Batch storage batch = batches[_batchId];
        require(batch.currentHolder == msg.sender, "Only current holder can transfer");
        require(!batch.expired, "Cannot transfer expired batch");
        require(!batch.spoiled, "Cannot transfer spoiled batch");
        
        address previousHolder = batch.currentHolder;
        batch.currentHolder = _to;
        
        emit BatchTransferred(_batchId, previousHolder, _to);
    }
    
    function markAsSpoiled(string memory _batchId, string memory _reason) 
        external 
        batchExistsCheck(_batchId) 
    {
        Batch storage batch = batches[_batchId];
        require(batch.currentHolder == msg.sender, "Only current holder can mark as spoiled");
        require(!batch.expired, "Batch already expired");
        
        batch.spoiled = true;
        batch.spoilReason = _reason;
        
        emit BatchSpoiled(_batchId, _reason);
    }
    
    function autoExpire(string memory _batchId) 
        external 
        batchExistsCheck(_batchId) 
    {
        Batch storage batch = batches[_batchId];
        require(!batch.expired, "Batch already expired");
        require(block.timestamp >= batch.expiryDate, "Batch not yet expired");
        
        batch.expired = true;
        emit BatchExpired(_batchId);
    }
    
    function updateCertificateHash(string memory _batchId, string memory _newHash) 
        external 
        batchExistsCheck(_batchId) 
    {
        Batch storage batch = batches[_batchId];
        require(batch.currentHolder == msg.sender, "Only current holder can update certificate");
        
        batch.certificateHash = _newHash;
        emit CertificateUpdated(_batchId, _newHash);
    }
    
    function getBatchDetails(string memory _batchId) 
        external 
        view 
        batchExistsCheck(_batchId)
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            bool,
            bool,
            string memory,
            string memory,
            address
        )
    {
        Batch memory batch = batches[_batchId];
        return (
            batch.batchId,
            batch.drugName,
            batch.manufacturer,
            batch.origin,
            batch.manufactureDate,
            batch.expiryDate,
            batch.expired,
            batch.spoiled,
            batch.spoilReason,
            batch.certificateHash,
            batch.currentHolder
        );
    }
    
    function checkBatchValidity(string memory _batchId) 
        external 
        view 
        batchExistsCheck(_batchId)
        returns (bool) 
    {
        Batch memory batch = batches[_batchId];
        return !batch.expired && !batch.spoiled && block.timestamp < batch.expiryDate;
    }
}