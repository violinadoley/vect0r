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


// File @openzeppelin/contracts/utils/Pausable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract Pausable is Context {
    bool private _paused;

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
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


// File contracts/VectorRegistry.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.27;



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
