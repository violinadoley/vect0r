// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title VectorRegistry
 * @dev Smart contract for managing vector collections and metadata on 0G Chain
 * Provides decentralized governance and access control for vector database operations
 */
contract VectorRegistry is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    struct Collection {
        string name;
        string description;
        uint256 dimension;
        uint256 vectorCount;
        address owner;
        bool isPublic;
        uint256 createdAt;
        uint256 updatedAt;
        string storageRoot; // 0G Storage root hash
        bytes32 metadataHash; // Hash of collection metadata
    }

    struct VectorMetadata {
        string collectionId;
        string vectorId;
        string storageHash; // 0G Storage hash for vector data
        uint256 timestamp;
        bytes32 contentHash; // Hash of vector content for integrity
    }

    // Storage
    mapping(string => Collection) public collections;
    mapping(string => VectorMetadata) public vectorMetadata;
    mapping(address => string[]) public userCollections;
    mapping(string => address[]) public collectionUsers;
    mapping(string => mapping(address => bool)) public collectionAccess;
    mapping(string => mapping(string => string)) public vectorAttributes; // vectorKey -> key -> value
    
    string[] public collectionIds;
    uint256 public totalCollections;
    uint256 public totalVectors;

    // Events
    event CollectionCreated(
        string indexed collectionId,
        string name,
        address indexed owner,
        uint256 dimension
    );

    event CollectionUpdated(
        string indexed collectionId,
        string storageRoot,
        uint256 vectorCount
    );

    event VectorAdded(
        string indexed collectionId,
        string indexed vectorId,
        address indexed user,
        string storageHash
    );

    event VectorRemoved(
        string indexed collectionId,
        string indexed vectorId
    );

    event AccessGranted(
        string indexed collectionId,
        address indexed user
    );

    event AccessRevoked(
        string indexed collectionId,
        address indexed user
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(USER_ROLE, msg.sender);
    }

    modifier onlyCollectionOwner(string memory collectionId) {
        require(
            collections[collectionId].owner == msg.sender || 
            hasRole(ADMIN_ROLE, msg.sender),
            "VectorRegistry: Not collection owner or admin"
        );
        _;
    }

    modifier collectionExists(string memory collectionId) {
        require(
            collections[collectionId].owner != address(0),
            "VectorRegistry: Collection does not exist"
        );
        _;
    }

    modifier hasCollectionAccess(string memory collectionId) {
        require(
            collections[collectionId].isPublic ||
            collections[collectionId].owner == msg.sender ||
            collectionAccess[collectionId][msg.sender] ||
            hasRole(ADMIN_ROLE, msg.sender),
            "VectorRegistry: Access denied"
        );
        _;
    }

    /**
     * @dev Create a new vector collection
     * @param collectionId Unique identifier for the collection
     * @param name Human-readable name
     * @param description Collection description
     * @param dimension Vector dimension
     * @param isPublic Whether the collection is publicly accessible
     */
    function createCollection(
        string memory collectionId,
        string memory name,
        string memory description,
        uint256 dimension,
        bool isPublic
    ) external whenNotPaused {
        require(hasRole(USER_ROLE, msg.sender), "VectorRegistry: User role required");
        require(bytes(collectionId).length > 0, "VectorRegistry: Invalid collection ID");
        require(bytes(name).length > 0, "VectorRegistry: Invalid collection name");
        require(dimension > 0, "VectorRegistry: Invalid dimension");
        require(collections[collectionId].owner == address(0), "VectorRegistry: Collection already exists");

        Collection storage collection = collections[collectionId];
        collection.name = name;
        collection.description = description;
        collection.dimension = dimension;
        collection.vectorCount = 0;
        collection.owner = msg.sender;
        collection.isPublic = isPublic;
        collection.createdAt = block.timestamp;
        collection.updatedAt = block.timestamp;

        collectionIds.push(collectionId);
        userCollections[msg.sender].push(collectionId);
        totalCollections++;

        emit CollectionCreated(collectionId, name, msg.sender, dimension);
    }

    /**
     * @dev Update collection metadata and storage information
     * @param collectionId Collection identifier
     * @param storageRoot 0G Storage root hash
     * @param vectorCount Updated vector count
     * @param metadataHash Hash of collection metadata
     */
    function updateCollection(
        string memory collectionId,
        string memory storageRoot,
        uint256 vectorCount,
        bytes32 metadataHash
    ) external whenNotPaused collectionExists(collectionId) onlyCollectionOwner(collectionId) {
        Collection storage collection = collections[collectionId];
        
        uint256 vectorDiff = vectorCount > collection.vectorCount 
            ? vectorCount - collection.vectorCount 
            : collection.vectorCount - vectorCount;
        
        if (vectorCount > collection.vectorCount) {
            totalVectors += vectorDiff;
        } else {
            // Prevent underflow
            if (vectorDiff > totalVectors) {
                totalVectors = 0;
            } else {
                totalVectors -= vectorDiff;
            }
        }

        collection.storageRoot = storageRoot;
        collection.vectorCount = vectorCount;
        collection.metadataHash = metadataHash;
        collection.updatedAt = block.timestamp;

        emit CollectionUpdated(collectionId, storageRoot, vectorCount);
    }

    /**
     * @dev Add vector metadata
     * @param collectionId Collection identifier
     * @param vectorId Vector identifier
     * @param storageHash 0G Storage hash for vector data
     * @param contentHash Hash of vector content
     */
    function addVectorMetadata(
        string memory collectionId,
        string memory vectorId,
        string memory storageHash,
        bytes32 contentHash
    ) external whenNotPaused collectionExists(collectionId) hasCollectionAccess(collectionId) {
        require(bytes(vectorId).length > 0, "VectorRegistry: Invalid vector ID");
        require(bytes(storageHash).length > 0, "VectorRegistry: Invalid storage hash");

        string memory vectorKey = string(abi.encodePacked(collectionId, ":", vectorId));
        
        VectorMetadata storage metadata = vectorMetadata[vectorKey];
        metadata.collectionId = collectionId;
        metadata.vectorId = vectorId;
        metadata.storageHash = storageHash;
        metadata.timestamp = block.timestamp;
        metadata.contentHash = contentHash;

        emit VectorAdded(collectionId, vectorId, msg.sender, storageHash);
    }

    /**
     * @dev Remove vector metadata
     * @param collectionId Collection identifier
     * @param vectorId Vector identifier
     */
    function removeVectorMetadata(
        string memory collectionId,
        string memory vectorId
    ) external whenNotPaused collectionExists(collectionId) onlyCollectionOwner(collectionId) {
        string memory vectorKey = string(abi.encodePacked(collectionId, ":", vectorId));
        delete vectorMetadata[vectorKey];

        emit VectorRemoved(collectionId, vectorId);
    }

    /**
     * @dev Grant access to a collection
     * @param collectionId Collection identifier
     * @param user User address to grant access
     */
    function grantAccess(
        string memory collectionId,
        address user
    ) external whenNotPaused collectionExists(collectionId) onlyCollectionOwner(collectionId) {
        require(user != address(0), "VectorRegistry: Invalid user address");
        require(!collectionAccess[collectionId][user], "VectorRegistry: User already has access");
        
        collectionAccess[collectionId][user] = true;
        collectionUsers[collectionId].push(user);
        userCollections[user].push(collectionId);

        emit AccessGranted(collectionId, user);
    }

    /**
     * @dev Revoke access to a collection
     * @param collectionId Collection identifier
     * @param user User address to revoke access
     */
    function revokeAccess(
        string memory collectionId,
        address user
    ) external whenNotPaused collectionExists(collectionId) onlyCollectionOwner(collectionId) {
        collectionAccess[collectionId][user] = false;
        emit AccessRevoked(collectionId, user);
    }

    /**
     * @dev Set vector attribute
     * @param collectionId Collection identifier
     * @param vectorId Vector identifier
     * @param key Attribute key
     * @param value Attribute value
     */
    function setVectorAttribute(
        string memory collectionId,
        string memory vectorId,
        string memory key,
        string memory value
    ) external whenNotPaused collectionExists(collectionId) hasCollectionAccess(collectionId) {
        string memory vectorKey = string(abi.encodePacked(collectionId, ":", vectorId));
        vectorAttributes[vectorKey][key] = value;
    }

    // View functions

    /**
     * @dev Get collection information
     */
    function getCollection(string memory collectionId) 
        external 
        view 
        returns (Collection memory) 
    {
        return collections[collectionId];
    }

    /**
     * @dev Get vector metadata
     */
    function getVectorMetadata(string memory collectionId, string memory vectorId)
        external
        view
        returns (string memory, string memory, uint256, bytes32)
    {
        string memory vectorKey = string(abi.encodePacked(collectionId, ":", vectorId));
        VectorMetadata storage metadata = vectorMetadata[vectorKey];
        return (
            metadata.storageHash,
            metadata.collectionId,
            metadata.timestamp,
            metadata.contentHash
        );
    }

    /**
     * @dev Get vector attribute
     */
    function getVectorAttribute(
        string memory collectionId,
        string memory vectorId,
        string memory key
    ) external view returns (string memory) {
        string memory vectorKey = string(abi.encodePacked(collectionId, ":", vectorId));
        return vectorAttributes[vectorKey][key];
    }

    /**
     * @dev Get user collections
     */
    function getUserCollections(address user) external view returns (string[] memory) {
        return userCollections[user];
    }

    /**
     * @dev Get collection users
     */
    function getCollectionUsers(string memory collectionId) external view returns (address[] memory) {
        return collectionUsers[collectionId];
    }

    /**
     * @dev Get all collection IDs
     */
    function getAllCollections() external view returns (string[] memory) {
        return collectionIds;
    }

    /**
     * @dev Check if user has access to collection
     */
    function hasAccess(string memory collectionId, address user) external view returns (bool) {
        return collections[collectionId].isPublic ||
               collections[collectionId].owner == user ||
               collectionAccess[collectionId][user];
    }

    // Admin functions

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Grant role to user (admin only)
     */
    function grantUserRole(address user) external onlyRole(ADMIN_ROLE) {
        _grantRole(USER_ROLE, user);
    }

    /**
     * @dev Get contract statistics
     */
    function getStats() external view returns (uint256, uint256, uint256) {
        return (totalCollections, totalVectors, collectionIds.length);
    }
}
