import hre from 'hardhat';

async function main() {
  const factory = await hre.ethers.getContractFactory('TechLanceTrust');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = await hre.ethers.provider.getNetwork();

  console.log('TechLanceTrust deployed');
  console.log('Network chainId:', Number(network.chainId));
  console.log('Address:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
