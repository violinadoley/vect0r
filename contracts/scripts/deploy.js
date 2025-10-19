const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VectorZero contracts...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy VectorRegistry
  console.log("\n📋 Deploying VectorRegistry...");
  const VectorRegistryFactory = await ethers.getContractFactory("VectorRegistry");
  const vectorRegistry = await VectorRegistryFactory.deploy();
  await vectorRegistry.waitForDeployment();
  
  const vectorRegistryAddress = await vectorRegistry.getAddress();
  console.log("✅ VectorRegistry deployed to:", vectorRegistryAddress);

  // Deploy StorageOracle
  console.log("\n🔮 Deploying StorageOracle...");
  const StorageOracleFactory = await ethers.getContractFactory("StorageOracle");
  const storageOracle = await StorageOracleFactory.deploy();
  await storageOracle.waitForDeployment();
  
  const storageOracleAddress = await storageOracle.getAddress();
  console.log("✅ StorageOracle deployed to:", storageOracleAddress);

  // Setup initial configuration
  console.log("\n⚙️  Setting up initial configuration...");
  
  try {
    // Grant user role to deployer for testing
    const userRoleTx = await vectorRegistry.grantUserRole(deployer.address);
    await userRoleTx.wait();
    console.log("✅ Granted USER_ROLE to deployer");

    // Grant oracle role to deployer for testing
    const oracleRoleTx = await storageOracle.grantOracleRole(deployer.address);
    await oracleRoleTx.wait();
    console.log("✅ Granted ORACLE_ROLE to deployer");

    // Create a demo collection
    const createCollectionTx = await vectorRegistry.createCollection(
      "demo-collection",
      "Demo Collection", 
      "A demo collection for testing VectorZero",
      768,
      true // public
    );
    await createCollectionTx.wait();
    console.log("✅ Created demo collection");

  } catch (error) {
    console.warn("⚠️  Setup configuration failed:", error.message);
  }

  // Display deployment summary
  console.log("\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Deployer:", deployer.address);
  console.log("VectorRegistry:", vectorRegistryAddress);
  console.log("StorageOracle:", storageOracleAddress);
  console.log("=====================================");

  // Save deployment addresses
  const deploymentInfo = {
    deployer: deployer.address,
    contracts: {
      VectorRegistry: vectorRegistryAddress,
      StorageOracle: storageOracleAddress
    },
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync('deployed-contracts.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Contract addresses saved to deployed-contracts.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
