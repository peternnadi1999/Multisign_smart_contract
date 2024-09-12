import { ethers } from "hardhat";

async function main() {
  const [owner, ad1, ad2] = await ethers.getSigners();

  const web3CXITokenAddress = "0xe336d36FacA76840407e6836d26119E1EcE0A2b4";
  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  const multisigfactoryContractAddress =
    "0xB8a934dcb74d0E3d1DF6Bce0faC12cD8B18801eD";
  const multisigfactory = await ethers.getContractAt(
    "IMultisigFactory",
    multisigfactoryContractAddress
  );

  const quorum = 3;
  const validSigners = [owner, ad1, ad2];

  // const multisigFaDe = await multisigfactory.createMultisigWallet(
  //   quorum,
  //   validSigners
  // );
  // multisigFaDe.wait();
  // console.log(multisigfa);

  const multisigfac = await multisigfactory.getMultiSigClones();
  // console.log(multisigfac);

  const firstAddr = multisigfac[1];
  const multisig = await ethers.getContractAt("IMultisig", firstAddr);

  // await web3CXI.transfer(multisig, ethers.parseUnits("100", 18));
  // await web3CXI.balanceOf(ad2);

  const transfertx = await multisig.connect(owner).transfer(
    ethers.parseUnits("10", 18),
    ad2,
    web3CXITokenAddress
  );
  console.log(transfertx);

  const approveTx1 = await multisig.connect(ad1).approveTx(1);
  approveTx1.wait();
  const approveTx2 = await multisig.connect(ad2).approveTx(1);
  approveTx2.wait();

  await web3CXI.balanceOf(ad2);

 // interact with the updatequorum of the deployed multisig
  const newQuorum = 2;
  const updateQuorumTx = await multisig.updateQuorum(newQuorum);
  await updateQuorumTx.wait();

  console.log("Update Quorum Tx", updateQuorumTx);

  await multisig.connect(ad1).approveTx(2);
  await multisig.connect(ad2).approveTx(2);
  

}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
