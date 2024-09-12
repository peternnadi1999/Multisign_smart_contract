import { ethers } from "hardhat";

async function main() {
  const [owner, ad1, ad2,] = await ethers.getSigners();

  const web3CXITokenAddress = "0xe336d36FacA76840407e6836d26119E1EcE0A2b4";
  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  const multisigfactoryContractAddress =
    "0xB8a934dcb74d0E3d1DF6Bce0faC12cD8B18801eD";
  const multisigfactory = await ethers.getContractAt(
    "MultisigFactory",
    multisigfactoryContractAddress
  );

  const quorum = 3;
  const validSigners = [owner, ad1, ad2];

  const multisig = await multisigfactory.createMultisigWallet(
    quorum,
    validSigners
  );
  console.log(multisig);

  const approvalAmount = ethers.parseUnits("1000", 18);

  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
