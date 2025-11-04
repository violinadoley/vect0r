import { expect } from "chai";
import { ethers } from "hardhat";
import { StorageOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("StorageOracle", function () {
  let storageOracle: StorageOracle;
  let owner: SignerWithAddress;
  let oracle: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, oracle, user] = await ethers.getSigners();

    const StorageOracleFactory = await ethers.getContractFactory("StorageOracle");
    storageOracle = await StorageOracleFactory.deploy();
    await storageOracle.waitForDeployment();

    // Grant ORACLE_ROLE to test oracle
    await storageOracle.grantOracleRole(oracle.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const adminRole = await storageOracle.ADMIN_ROLE();
      expect(await storageOracle.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should initialize with zero active nodes", async function () {
      const [totalStored, totalNodes, activeRoots, minReplication] = 
        await storageOracle.getStorageStats();
      expect(totalNodes).to.equal(0);
      expect(minReplication).to.equal(3);
    });
  });

  describe("Node Registration", function () {
    it("Should register a storage node", async function () {
      await storageOracle.connect(oracle).registerNode("node-1", 1000);
      
      const node = await storageOracle.getStorageNode("node-1");
      expect(node.nodeAddress).to.equal("node-1");
      expect(node.totalStorage).to.equal(1000);
      expect(node.isActive).to.be.true;
    });

    it("Should not allow non-oracle to register nodes", async function () {
      await expect(
        storageOracle.connect(user).registerNode("node-1", 1000)
      ).to.be.revertedWith("StorageOracle: Oracle role required");
    });
  });

  describe("Data Storage with Duplicate Prevention", function () {
    beforeEach(async function () {
      await storageOracle.connect(oracle).registerNode("node-1", 1000);
      await storageOracle.connect(oracle).registerNode("node-2", 1000);
      await storageOracle.connect(oracle).registerNode("node-3", 1000);
    });

    it("Should register data to multiple nodes", async function () {
      const root = "0x1234567890abcdef";
      const integrityHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
      
      await storageOracle.connect(oracle).registerDataStorage(
        root,
        ["node-1", "node-2", "node-3"],
        1024,
        integrityHash
      );

      const entry = await storageOracle.getStorageEntry(root);
      expect(entry.isActive).to.be.true;
      expect(entry.replicationFactor).to.equal(3);
      expect(entry.size).to.equal(1024);
    });

    it("Should remove duplicate node addresses", async function () {
      const root = "0xabcdef1234567890";
      const integrityHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
      
      // Register with duplicate nodes
      await storageOracle.connect(oracle).registerDataStorage(
        root,
        ["node-1", "node-2", "node-1", "node-3", "node-2"], // node-1 and node-2 duplicated
        2048,
        integrityHash
      );

      const entry = await storageOracle.getStorageEntry(root);
      expect(entry.replicationFactor).to.equal(3); // Should be 3 unique nodes, not 5
      expect(entry.nodeAddresses).to.have.length(3);
    });

    it("Should reject registration to inactive nodes", async function () {
      const root = "0xdeadbeef";
      const integrityHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
      
      await expect(
        storageOracle.connect(oracle).registerDataStorage(
          root,
          ["invalid-node"], // Not registered
          512,
          integrityHash
        )
      ).to.be.revertedWith("StorageOracle: Node not active");
    });

    it("Should request replication if below minimum", async function () {
      const root = "0xreplication-test";
      const integrityHash = ethers.keccak256(ethers.toUtf8Bytes("data"));
      
      // Only 2 nodes when minimum is 3
      await storageOracle.connect(oracle).registerDataStorage(
        root,
        ["node-1", "node-2"],
        512,
        integrityHash
      );

      const hasEnough = await storageOracle.hasSufficientReplication(root);
      expect(hasEnough).to.be.false;
    });
  });

  describe("Node Integrity and Auto-Deactivation", function () {
    beforeEach(async function () {
      await storageOracle.connect(oracle).registerNode("node-1", 1000);
      await storageOracle.connect(oracle).registerDataStorage(
        "0xtest-root",
        ["node-1"],
        1024,
        ethers.keccak256(ethers.toUtf8Bytes("test data"))
      );
    });

    it("Should reduce reliability on integrity violation", async function () {
      await storageOracle.connect(oracle).verifyIntegrity(
        "0xtest-root",
        "node-1",
        ethers.keccak256(ethers.toUtf8Bytes("wrong data")) // Wrong hash
      );

      const node = await storageOracle.getStorageNode("node-1");
      expect(node.reliability).to.equal(90); // Reduced from 100
      expect(node.isActive).to.be.true; // Still active above threshold
    });

    it("Should auto-deactivate node when reliability drops too low", async function () {
      // Violate integrity 8 times to get below 30
      for (let i = 0; i < 8; i++) {
        await storageOracle.connect(oracle).verifyIntegrity(
          "0xtest-root",
          "node-1",
          ethers.keccak256(ethers.toUtf8Bytes("wrong data"))
        );
      }

      const node = await storageOracle.getStorageNode("node-1");
      expect(node.reliability).to.be.lt(30);
      expect(node.isActive).to.be.false; // Should be deactivated
    });
  });

  describe("Replication Management", function () {
    beforeEach(async function () {
      await storageOracle.connect(oracle).registerNode("node-1", 1000);
      await storageOracle.connect(oracle).registerNode("node-2", 1000);
      await storageOracle.connect(oracle).registerNode("node-3", 1000);
      await storageOracle.connect(oracle).registerNode("node-4", 1000);
      
      await storageOracle.connect(oracle).registerDataStorage(
        "0xtest-root",
        ["node-1", "node-2", "node-3"],
        1024,
        ethers.keccak256(ethers.toUtf8Bytes("test data"))
      );
    });

    it("Should complete replication and update node mappings", async function () {
      // Request replication
      await storageOracle.connect(oracle).requestReplication("0xtest-root", 4);
      
      // Complete replication with new nodes
      await storageOracle.connect(oracle).completeReplication(
        "0xtest-root",
        ["node-2", "node-3", "node-4"] // Changed nodes
      );

      const entry = await storageOracle.getStorageEntry("0xtest-root");
      expect(entry.replicationFactor).to.equal(3);
      expect(entry.nodeAddresses[0]).to.equal("node-2");
    });

    it("Should reject replication below minimum factor", async function () {
      await storageOracle.connect(oracle).requestReplication("0xtest-root", 4);
      
      await expect(
        storageOracle.connect(oracle).completeReplication(
          "0xtest-root",
          ["node-1", "node-2"] // Only 2, below minimum of 3
        )
      ).to.be.revertedWith("StorageOracle: Insufficient replication");
    });

    it("Should remove duplicate nodes during replication", async function () {
      await storageOracle.connect(oracle).requestReplication("0xtest-root", 4);
      
      await storageOracle.connect(oracle).completeReplication(
        "0xtest-root",
        ["node-1", "node-2", "node-3", "node-1", "node-4"] // node-1 duplicated
      );

      const entry = await storageOracle.getStorageEntry("0xtest-root");
      expect(entry.replicationFactor).to.equal(4); // Should be 4 unique nodes
    });

    it("Should reject replication with inactive nodes", async function () {
      await storageOracle.connect(oracle).requestReplication("0xtest-root", 4);
      
      await expect(
        storageOracle.connect(oracle).completeReplication(
          "0xtest-root",
          ["node-1", "node-2", "invalid-node"]
        )
      ).to.be.revertedWith("StorageOracle: Node not active");
    });
  });

  describe("Statistics", function () {
    it("Should track total stored data", async function () {
      await storageOracle.connect(oracle).registerNode("node-1", 1000);
      await storageOracle.connect(oracle).registerNode("node-2", 1000);
      
      await storageOracle.connect(oracle).registerDataStorage(
        "0xroot1",
        ["node-1", "node-2"],
        1024,
        ethers.keccak256(ethers.toUtf8Bytes("data1"))
      );

      await storageOracle.connect(oracle).registerDataStorage(
        "0xroot2",
        ["node-1", "node-2"],
        2048,
        ethers.keccak256(ethers.toUtf8Bytes("data2"))
      );

      const [totalStored, totalNodes, activeRoots, minReplication] = 
        await storageOracle.getStorageStats();
      expect(totalStored).to.equal(1024 + 2048);
      expect(activeRoots).to.equal(2);
    });
  });
});

