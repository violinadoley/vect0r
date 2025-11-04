// Sources flattened with hardhat v2.26.5 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/access/IAccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/IAccessControl.sol)

pragma solidity >=0.8.4;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted to signal this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/utils/introspection/ERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165 is IERC165 {
    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/AccessControl.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;



/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControl is Context, IAccessControl, ERC165 {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    mapping(bytes32 role => RoleData) private _roles;

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        return _roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        return _roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        if (!hasRole(role, account)) {
            _roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` from `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        if (hasRole(role, account)) {
            _roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/StorageOracle.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.27;


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
