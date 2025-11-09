const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with:', deployer.address);

  const FeeCollector = await ethers.getContractFactory('FeeCollector');
  const feeCollector = await FeeCollector.deploy(deployer.address, 10); // 0.1%
  await feeCollector.waitForDeployment();
  console.log('FeeCollector:', await feeCollector.getAddress());

  const OracleRegistry = await ethers.getContractFactory('OracleRegistry');
  const registry = await OracleRegistry.deploy();
  await registry.waitForDeployment();
  console.log('OracleRegistry:', await registry.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});