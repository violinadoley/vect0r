// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StorageOracle
 * @dev Tracks data distribution and availability across 0G Storage nodes
 * Provides integrity verification and redundancy management
 */
contract StorageOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct StorageEntry {
        string root; // 0G Storage root hash
        string[] nodeAddresses; // Storage nodes holding the data
        uint256 size; // Data size in bytes
        uint256 replicationFactor; // Number of replicas
        uint256 timestamp; // Last update timestamp
        bool isActive; // Whether the data is actively stored
        bytes32 integrityHash; // Hash for integrity verification
    }

    struct StorageNode {
        string nodeAddress;
        uint256 totalStorage; // Total storage capacity
        uint256 usedStorage; // Used storage
        uint256 reliability; // Reliability score (0-100)
        uint256 lastSeen; // Last heartbeat timestamp
        bool isActive; // Whether the node is active
    }

    struct ReplicationRequest {
        string root;
        uint256 targetReplicas;
        uint256 currentReplicas;
        uint256 requestTime;
        bool fulfilled;
    }

    // Storage
    mapping(string => StorageEntry) public storageEntries;
    mapping(string => StorageNode) public storageNodes;
    mapping(string => ReplicationRequest) public replicationRequests;
    
    string[] public activeRoots;
    string[] public activeNodes;
    mapping(string => string[]) public nodeDataMap; // node -> roots
    
    uint256 public totalStoredData;
    uint256 public totalActiveNodes;
    uint256 public minReplicationFactor = 3;

    // Events
    event DataStored(
        string indexed root,
        string[] nodeAddresses,
        uint256 size,
        uint256 replicationFactor
    );

    event DataRemoved(
        string indexed root,
        uint256 size
    );

    event NodeRegistered(
        string indexed nodeAddress,
        uint256 totalStorage
    );

    event NodeUpdated(
        string indexed nodeAddress,
        uint256 usedStorage,
        uint256 reliability
    );

    event NodeDeactivated(
        string indexed nodeAddress
    );

    event ReplicationRequested(
        string indexed root,
        uint256 targetReplicas
    );

    event ReplicationCompleted(
        string indexed root,
        uint256 newReplicationFactor
    );

    event IntegrityViolation(
        string indexed root,
        string indexed nodeAddress,
        bytes32 expectedHash,
        bytes32 actualHash
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    modifier onlyOracle() {
        require(hasRole(ORACLE_ROLE, msg.sender), "StorageOracle: Oracle role required");
        _;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "StorageOracle: Admin role required");
        _;
    }

    /**
     * @dev Remove duplicate node addresses
     * @param addresses Array of node addresses
     * @return Unique array of node addresses
     */
    function _removeDuplicates(string[] memory addresses) internal pure returns (string[] memory) {
        if (addresses.length == 0) {
            return addresses;
        }
        
        // Use a temporary array to track unique addresses
        string[] memory unique = new string[](addresses.length);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < addresses.length; i++) {
            bool isDuplicate = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (keccak256(bytes(unique[j])) == keccak256(bytes(addresses[i]))) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                unique[uniqueCount] = addresses[i];
                uniqueCount++;
            }
        }
        
        // Resize array to actual unique count
        string[] memory result = new string[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            result[i] = unique[i];
        }
        
        return result;
    }

    /**
     * @dev Register data storage across 0G nodes
     * @param root 0G Storage root hash
     * @param nodeAddresses Array of node addresses storing the data
     * @param size Data size in bytes
     * @param integrityHash Hash for integrity verification
     */
    function registerDataStorage(
        string memory root,
        string[] memory nodeAddresses,
        uint256 size,
        bytes32 integrityHash
    ) external onlyOracle nonReentrant {
        require(bytes(root).length > 0, "StorageOracle: Invalid root hash");
        require(nodeAddresses.length > 0, "StorageOracle: No storage nodes provided");
        require(size > 0, "StorageOracle: Invalid size");

        // Remove duplicates and validate nodes are active
        string[] memory uniqueNodes = _removeDuplicates(nodeAddresses);
        require(uniqueNodes.length > 0, "StorageOracle: No valid nodes after deduplication");
        
        for (uint256 i = 0; i < uniqueNodes.length; i++) {
            require(storageNodes[uniqueNodes[i]].isActive, "StorageOracle: Node not active");
        }

        StorageEntry storage entry = storageEntries[root];
        
        if (!entry.isActive) {
            activeRoots.push(root);
            totalStoredData += size;
        } else {
            // Update existing entry
            totalStoredData = totalStoredData - (entry.size) + size;
        }

        entry.root = root;
        entry.nodeAddresses = uniqueNodes;
        entry.size = size;
        entry.replicationFactor = uniqueNodes.length;
        entry.timestamp = block.timestamp;
        entry.isActive = true;
        entry.integrityHash = integrityHash;

        // Update node data mappings
        for (uint256 i = 0; i < uniqueNodes.length; i++) {
            _addDataToNode(uniqueNodes[i], root);
            _updateNodeUsage(uniqueNodes[i], size, true);
        }

        emit DataStored(root, uniqueNodes, size, uniqueNodes.length);

        // Check if replication is sufficient
        if (uniqueNodes.length < minReplicationFactor) {
            _requestReplication(root, minReplicationFactor);
        }
    }

    /**
     * @dev Remove data storage entry
     * @param root 0G Storage root hash
     */
    function removeDataStorage(string memory root) external onlyOracle nonReentrant {
        StorageEntry storage entry = storageEntries[root];
        require(entry.isActive, "StorageOracle: Data not found or already removed");

        // Update node usage
        for (uint256 i = 0; i < entry.nodeAddresses.length; i++) {
            _updateNodeUsage(entry.nodeAddresses[i], entry.size, false);
            _removeDataFromNode(entry.nodeAddresses[i], root);
        }

        totalStoredData -= entry.size;
        entry.isActive = false;

        emit DataRemoved(root, entry.size);
    }

    /**
     * @dev Register a new storage node
     * @param nodeAddress Node address/identifier
     * @param totalStorage Total storage capacity
     */
    function registerNode(
        string memory nodeAddress,
        uint256 totalStorage
    ) external onlyOracle {
        require(bytes(nodeAddress).length > 0, "StorageOracle: Invalid node address");
        require(totalStorage > 0, "StorageOracle: Invalid storage capacity");

        StorageNode storage node = storageNodes[nodeAddress];
        
        if (!node.isActive) {
            activeNodes.push(nodeAddress);
            totalActiveNodes++;
        }

        node.nodeAddress = nodeAddress;
        node.totalStorage = totalStorage;
        node.usedStorage = 0;
        node.reliability = 100; // Start with perfect reliability
        node.lastSeen = block.timestamp;
        node.isActive = true;

        emit NodeRegistered(nodeAddress, totalStorage);
    }

    /**
     * @dev Update node status and metrics
     * @param nodeAddress Node address
     * @param usedStorage Current used storage
     * @param reliability Reliability score (0-100)
     */
    function updateNodeStatus(
        string memory nodeAddress,
        uint256 usedStorage,
        uint256 reliability
    ) external onlyOracle {
        StorageNode storage node = storageNodes[nodeAddress];
        require(node.isActive, "StorageOracle: Node not found or inactive");
        require(reliability <= 100, "StorageOracle: Invalid reliability score");

        node.usedStorage = usedStorage;
        node.reliability = reliability;
        node.lastSeen = block.timestamp;

        emit NodeUpdated(nodeAddress, usedStorage, reliability);
    }

    /**
     * @dev Deactivate a storage node
     * @param nodeAddress Node address
     */
    function deactivateNode(string memory nodeAddress) external onlyOracle {
        StorageNode storage node = storageNodes[nodeAddress];
        require(node.isActive, "StorageOracle: Node not found or already inactive");

        node.isActive = false;
        totalActiveNodes--;

        emit NodeDeactivated(nodeAddress);

        // Check replication for all data on this node
        string[] storage nodeData = nodeDataMap[nodeAddress];
        for (uint256 i = 0; i < nodeData.length; i++) {
            _checkReplication(nodeData[i]);
        }
    }

    /**
     * @dev Verify data integrity
     * @param root 0G Storage root hash
     * @param nodeAddress Node address
     * @param actualHash Actual hash from verification
     */
    function verifyIntegrity(
        string memory root,
        string memory nodeAddress,
        bytes32 actualHash
    ) external onlyOracle {
        StorageEntry storage entry = storageEntries[root];
        require(entry.isActive, "StorageOracle: Data not found");

        if (actualHash != entry.integrityHash) {
            emit IntegrityViolation(root, nodeAddress, entry.integrityHash, actualHash);
            
            // Reduce node reliability
            StorageNode storage node = storageNodes[nodeAddress];
            if (node.reliability > 10) {
                node.reliability -= 10;
            }
            
            // Auto-deactivate if reliability too low
            if (node.reliability <= 30 && node.isActive) {
                node.isActive = false;
                if (totalActiveNodes > 0) {
                    totalActiveNodes--;
                }
                emit NodeDeactivated(nodeAddress);
                // Trigger replication check for all data on this node
                string[] storage nodeData = nodeDataMap[nodeAddress];
                for (uint256 i = 0; i < nodeData.length; i++) {
                    _checkReplication(nodeData[i]);
                }
            }
        }
    }

    /**
     * @dev Request data replication
     * @param root 0G Storage root hash
     * @param targetReplicas Target number of replicas
     */
    function requestReplication(
        string memory root,
        uint256 targetReplicas
    ) external onlyOracle {
        require(targetReplicas >= minReplicationFactor, "StorageOracle: Below minimum replication");
        _requestReplication(root, targetReplicas);
    }

    /**
     * @dev Complete replication request
     * @param root 0G Storage root hash
     * @param newNodeAddresses Updated array of node addresses
     */
    function completeReplication(
        string memory root,
        string[] memory newNodeAddresses
    ) external onlyOracle {
        StorageEntry storage entry = storageEntries[root];
        require(entry.isActive, "StorageOracle: Data not found");

        ReplicationRequest storage request = replicationRequests[root];
        require(!request.fulfilled, "StorageOracle: Replication already completed");
        
        // Remove duplicates
        string[] memory uniqueNodes = _removeDuplicates(newNodeAddresses);
        require(uniqueNodes.length >= minReplicationFactor, "StorageOracle: Insufficient replication");
        
        // Validate all nodes are active
        for (uint256 i = 0; i < uniqueNodes.length; i++) {
            require(storageNodes[uniqueNodes[i]].isActive, "StorageOracle: Node not active");
        }
        
        // Remove old node mappings
        for (uint256 i = 0; i < entry.nodeAddresses.length; i++) {
            _removeDataFromNode(entry.nodeAddresses[i], root);
        }
        
        // Add new node mappings
        for (uint256 i = 0; i < uniqueNodes.length; i++) {
            _addDataToNode(uniqueNodes[i], root);
        }

        // Update storage entry
        entry.nodeAddresses = uniqueNodes;
        entry.replicationFactor = uniqueNodes.length;
        entry.timestamp = block.timestamp;

        // Mark request as fulfilled
        request.fulfilled = true;

        emit ReplicationCompleted(root, uniqueNodes.length);
    }

    // View functions

    /**
     * @dev Get storage entry information
     */
    function getStorageEntry(string memory root)
        external
        view
        returns (StorageEntry memory)
    {
        return storageEntries[root];
    }

    /**
     * @dev Get storage node information
     */
    function getStorageNode(string memory nodeAddress)
        external
        view
        returns (StorageNode memory)
    {
        return storageNodes[nodeAddress];
    }

    /**
     * @dev Get all active roots
     */
    function getActiveRoots() external view returns (string[] memory) {
        return activeRoots;
    }

    /**
     * @dev Get all active nodes
     */
    function getActiveNodes() external view returns (string[] memory) {
        return activeNodes;
    }

    /**
     * @dev Check if data has sufficient replication
     */
    function hasSufficientReplication(string memory root) external view returns (bool) {
        return storageEntries[root].replicationFactor >= minReplicationFactor;
    }

    /**
     * @dev Get storage statistics
     */
    function getStorageStats()
        external
        view
        returns (uint256, uint256, uint256, uint256)
    {
        return (totalStoredData, totalActiveNodes, activeRoots.length, minReplicationFactor);
    }

    // Internal functions

    function _addDataToNode(string memory nodeAddress, string memory root) internal {
        nodeDataMap[nodeAddress].push(root);
    }

    function _removeDataFromNode(string memory nodeAddress, string memory root) internal {
        string[] storage nodeData = nodeDataMap[nodeAddress];
        for (uint256 i = 0; i < nodeData.length; i++) {
            if (keccak256(bytes(nodeData[i])) == keccak256(bytes(root))) {
                nodeData[i] = nodeData[nodeData.length - 1];
                nodeData.pop();
                break;
            }
        }
    }

    function _updateNodeUsage(
        string memory nodeAddress,
        uint256 dataSize,
        bool isAddition
    ) internal {
        StorageNode storage node = storageNodes[nodeAddress];
        if (isAddition) {
            node.usedStorage += dataSize;
        } else if (node.usedStorage >= dataSize) {
            node.usedStorage -= dataSize;
        }
    }

    function _requestReplication(string memory root, uint256 targetReplicas) internal {
        StorageEntry storage entry = storageEntries[root];
        
        replicationRequests[root] = ReplicationRequest({
            root: root,
            targetReplicas: targetReplicas,
            currentReplicas: entry.replicationFactor,
            requestTime: block.timestamp,
            fulfilled: false
        });

        emit ReplicationRequested(root, targetReplicas);
    }

    function _checkReplication(string memory root) internal {
        StorageEntry storage entry = storageEntries[root];
        if (entry.isActive && entry.replicationFactor < minReplicationFactor) {
            _requestReplication(root, minReplicationFactor);
        }
    }

    // Admin functions

    /**
     * @dev Set minimum replication factor
     */
    function setMinReplicationFactor(uint256 newMinReplication) external onlyAdmin {
        require(newMinReplication > 0, "StorageOracle: Invalid replication factor");
        minReplicationFactor = newMinReplication;
    }

    /**
     * @dev Grant oracle role
     */
    function grantOracleRole(address oracle) external onlyAdmin {
        _grantRole(ORACLE_ROLE, oracle);
    }

    /**
     * @dev Revoke oracle role
     */
    function revokeOracleRole(address oracle) external onlyAdmin {
        _revokeRole(ORACLE_ROLE, oracle);
    }
}
