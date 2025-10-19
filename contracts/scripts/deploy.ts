import { ethers } from "hardhat";
import { VectorRegistry, StorageOracle } from "../typechain-types";

async function main() {
  console.log("🚀 Deploying VectorZero contracts to 0G Network...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📱 Deploying with account:", deployer.address);
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("❌ Insufficient balance! Need at least 0.01 ETH for deployment.");
  }

  // Deploy VectorRegistry
  console.log("\\n📋 Deploying VectorRegistry...");
  const VectorRegistryFactory = await ethers.getContractFactory("VectorRegistry");
  const vectorRegistry = await VectorRegistryFactory.deploy();
  await vectorRegistry.waitForDeployment();
  
  const vectorRegistryAddress = await vectorRegistry.getAddress();
  console.log("✅ VectorRegistry deployed to:", vectorRegistryAddress);

  // Deploy StorageOracle
  console.log("\\n🔮 Deploying StorageOracle...");
  const StorageOracleFactory = await ethers.getContractFactory("StorageOracle");
  const storageOracle = await StorageOracleFactory.deploy();
  await storageOracle.waitForDeployment();
  
  const storageOracleAddress = await storageOracle.getAddress();
  console.log("✅ StorageOracle deployed to:", storageOracleAddress);

  // Verify deployments
  console.log("\\n🔍 Verifying deployments...");
  
  // Test VectorRegistry
  const totalCollections = await vectorRegistry.totalCollections();
  console.log("📊 VectorRegistry total collections:", totalCollections.toString());
  
  // Test StorageOracle
  const [totalData, totalNodes] = await storageOracle.getStorageStats();
  console.log("💾 StorageOracle stats - Data:", totalData.toString(), "Nodes:", totalNodes.toString());

  // Setup initial configuration
  console.log("\\n⚙️  Setting up initial configuration...");
  
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

    // Register a demo storage node
    const registerNodeTx = await storageOracle.registerNode(
      "node-001", 
      ethers.parseEther("100") // 100 ETH worth of storage capacity
    );
    await registerNodeTx.wait();
    console.log("✅ Registered demo storage node");

  } catch (error) {
    console.warn("⚠️  Setup configuration failed:", error);
  }

  // Display deployment summary
  console.log("\\n📋 Deployment Summary:");
  console.log("=====================================");
  console.log("Network:", await ethers.provider.getNetwork().then(n => n.name));
  console.log("Chain ID:", await ethers.provider.getNetwork().then(n => n.chainId.toString()));
  console.log("Deployer:", deployer.address);
  console.log("VectorRegistry:", vectorRegistryAddress);
  console.log("StorageOracle:", storageOracleAddress);
  console.log("=====================================");

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: await ethers.provider.getNetwork().then(n => n.name),
    chainId: await ethers.provider.getNetwork().then(n => n.chainId.toString()),
    deployer: deployer.address,
    contracts: {
      VectorRegistry: vectorRegistryAddress,
      StorageOracle: storageOracleAddress
    },
    timestamp: new Date().toISOString(),
    gasUsed: {
      VectorRegistry: "Estimated",
      StorageOracle: "Estimated"
    }
  };

  const fs = require('fs');
  const path = require('path');
  
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `deployment-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\\n💾 Deployment info saved to: deployments/${filename}`);
  console.log("\\n🎉 Deployment completed successfully!");

  // Instructions for next steps
  console.log("\\n📝 Next Steps:");
  console.log("1. Update your backend .env file with these contract addresses");
  console.log("2. Fund your account if needed for transactions");
  console.log("3. Start the backend server and test the integration");
  console.log("4. Deploy the frontend and connect to these contracts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  });
