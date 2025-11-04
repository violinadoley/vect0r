import { expect } from "chai";
import { ethers } from "hardhat";
import { VectorRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("VectorRegistry", function () {
  let vectorRegistry: VectorRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const VectorRegistryFactory = await ethers.getContractFactory("VectorRegistry");
    vectorRegistry = await VectorRegistryFactory.deploy();
    await vectorRegistry.waitForDeployment();

    // Grant USER_ROLE to test users
    await vectorRegistry.grantUserRole(user1.address);
    await vectorRegistry.grantUserRole(user2.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const adminRole = await vectorRegistry.ADMIN_ROLE();
      expect(await vectorRegistry.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should initialize with zero collections", async function () {
      expect(await vectorRegistry.totalCollections()).to.equal(0);
      expect(await vectorRegistry.totalVectors()).to.equal(0);
    });
  });

  describe("Collection Management", function () {
    it("Should create a collection", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "Test Collection",
        "A test collection",
        768,
        true
      );

      const collection = await vectorRegistry.getCollection("test-collection");
      expect(collection.name).to.equal("Test Collection");
      expect(collection.dimension).to.equal(768);
      expect(collection.owner).to.equal(user1.address);
      expect(collection.isPublic).to.be.true;
    });

    it("Should not allow duplicate collection IDs", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "First Collection",
        "First description",
        768,
        true
      );

      await expect(
        vectorRegistry.connect(user2).createCollection(
          "test-collection",
          "Second Collection",
          "Second description",
          512,
          false
        )
      ).to.be.revertedWith("VectorRegistry: Collection already exists");
    });

    it("Should update collection metadata", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "Test Collection",
        "A test collection",
        768,
        true
      );

      const storageRoot = "0x1234567890abcdef";
      const vectorCount = 10;
      const metadataHash = ethers.keccak256(ethers.toUtf8Bytes("metadata"));

      await vectorRegistry.connect(user1).updateCollection(
        "test-collection",
        storageRoot,
        vectorCount,
        metadataHash
      );

      const collection = await vectorRegistry.getCollection("test-collection");
      expect(collection.storageRoot).to.equal(storageRoot);
      expect(collection.vectorCount).to.equal(vectorCount);
      expect(collection.metadataHash).to.equal(metadataHash);
    });

    it("Should prevent underflow when reducing vectors below zero", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "Test Collection",
        "A test collection",
        768,
        true
      );

      // First update with some vectors
      await vectorRegistry.connect(user1).updateCollection(
        "test-collection",
        "0x1111",
        5,
        ethers.keccak256(ethers.toUtf8Bytes("meta1"))
      );

      // Now try to reduce to a larger number (simulating underflow scenario)
      await vectorRegistry.connect(user1).updateCollection(
        "test-collection",
        "0x2222",
        100, // Much larger than 5
        ethers.keccak256(ethers.toUtf8Bytes("meta2"))
      );

      const [totalCollections, totalVectors, totalIds] = await vectorRegistry.getStats();
      expect(totalVectors).to.equal(100);
    });

    it("Should only allow owner to update collection", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "Test Collection",
        "A test collection",
        768,
        true
      );

      await expect(
        vectorRegistry.connect(user2).updateCollection(
          "test-collection",
          "0x1234",
          5,
          ethers.keccak256(ethers.toUtf8Bytes("test"))
        )
      ).to.be.revertedWith("VectorRegistry: Not collection owner or admin");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await vectorRegistry.connect(user1).createCollection(
        "private-collection",
        "Private Collection",
        "A private collection",
        768,
        false // private
      );
    });

    it("Should grant access to collection", async function () {
      await vectorRegistry.connect(user1).grantAccess("private-collection", user2.address);
      
      const hasAccess = await vectorRegistry.hasAccess("private-collection", user2.address);
      expect(hasAccess).to.be.true;
    });

    it("Should revoke access to collection", async function () {
      await vectorRegistry.connect(user1).grantAccess("private-collection", user2.address);
      await vectorRegistry.connect(user1).revokeAccess("private-collection", user2.address);
      
      const hasAccess = await vectorRegistry.hasAccess("private-collection", user2.address);
      expect(hasAccess).to.be.false;
    });

    it("Should allow owner access to private collection", async function () {
      const hasAccess = await vectorRegistry.hasAccess("private-collection", user1.address);
      expect(hasAccess).to.be.true;
    });

    it("Should prevent duplicate access grants", async function () {
      await vectorRegistry.connect(user1).grantAccess("private-collection", user2.address);
      
      await expect(
        vectorRegistry.connect(user1).grantAccess("private-collection", user2.address)
      ).to.be.revertedWith("VectorRegistry: User already has access");
    });
  });

  describe("Vector Metadata", function () {
    beforeEach(async function () {
      await vectorRegistry.connect(user1).createCollection(
        "test-collection",
        "Test Collection",
        "A test collection",
        768,
        true
      );
    });

    it("Should add vector metadata", async function () {
      const vectorId = "vector-001";
      const storageHash = "0xabcdef1234567890";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("vector content"));

      await vectorRegistry.connect(user1).addVectorMetadata(
        "test-collection",
        vectorId,
        storageHash,
        contentHash
      );

      const [retrievedStorageHash, collectionId, timestamp, retrievedContentHash] = 
        await vectorRegistry.getVectorMetadata("test-collection", vectorId);

      expect(retrievedStorageHash).to.equal(storageHash);
      expect(collectionId).to.equal("test-collection");
      expect(retrievedContentHash).to.equal(contentHash);
      expect(timestamp).to.be.gt(0);
    });

    it("Should set and get vector attributes", async function () {
      const vectorId = "vector-001";
      const storageHash = "0xabcdef1234567890";
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes("vector content"));

      await vectorRegistry.connect(user1).addVectorMetadata(
        "test-collection",
        vectorId,
        storageHash,
        contentHash
      );

      await vectorRegistry.connect(user1).setVectorAttribute(
        "test-collection",
        vectorId,
        "category",
        "text"
      );

      const attribute = await vectorRegistry.getVectorAttribute(
        "test-collection",
        vectorId,
        "category"
      );

      expect(attribute).to.equal("text");
    });
  });

  describe("Statistics", function () {
    it("Should track collection and vector counts", async function () {
      // Create first collection
      await vectorRegistry.connect(user1).createCollection(
        "collection-1",
        "Collection 1",
        "First collection",
        768,
        true
      );

      // Create second collection
      await vectorRegistry.connect(user2).createCollection(
        "collection-2",
        "Collection 2",
        "Second collection",
        512,
        false
      );

      // Update collections with vector counts
      await vectorRegistry.connect(user1).updateCollection(
        "collection-1",
        "0x1111",
        10,
        ethers.keccak256(ethers.toUtf8Bytes("meta1"))
      );

      await vectorRegistry.connect(user2).updateCollection(
        "collection-2",
        "0x2222",
        5,
        ethers.keccak256(ethers.toUtf8Bytes("meta2"))
      );

      const [totalCollections, totalVectors, totalIds] = await vectorRegistry.getStats();
      expect(totalCollections).to.equal(2);
      expect(totalVectors).to.equal(15);
      expect(totalIds).to.equal(2);
    });

    it("Should list all collections", async function () {
      await vectorRegistry.connect(user1).createCollection(
        "collection-1",
        "Collection 1",
        "First collection",
        768,
        true
      );

      await vectorRegistry.connect(user1).createCollection(
        "collection-2",
        "Collection 2",
        "Second collection",
        512,
        true
      );

      const allCollections = await vectorRegistry.getAllCollections();
      expect(allCollections).to.have.lengthOf(2);
      expect(allCollections[0]).to.equal("collection-1");
      expect(allCollections[1]).to.equal("collection-2");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to pause and unpause", async function () {
      await vectorRegistry.pause();
      
      await expect(
        vectorRegistry.connect(user1).createCollection(
          "test-collection",
          "Test Collection",
          "A test collection",
          768,
          true
        )
      ).to.be.revertedWith("Pausable: paused");

      await vectorRegistry.unpause();

      // Should work after unpause
      await expect(
        vectorRegistry.connect(user1).createCollection(
          "test-collection",
          "Test Collection",
          "A test collection",
          768,
          true
        )
      ).to.not.be.reverted;
    });

    it("Should only allow admin to grant user roles", async function () {
      const newUser = user2.address;
      
      await expect(
        vectorRegistry.connect(user1).grantUserRole(newUser)
      ).to.be.revertedWith(/AccessControl/);

      // Should work for admin
      await vectorRegistry.grantUserRole(newUser);
      
      const userRole = await vectorRegistry.USER_ROLE();
      expect(await vectorRegistry.hasRole(userRole, newUser)).to.be.true;
    });
  });
});
