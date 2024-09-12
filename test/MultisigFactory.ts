import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("MultisigFactory", function () {
  async function deployMultisigFactory() {
    const [owner, adr1, adr2, adr3] = await hre.ethers.getSigners();

    const MultisigFactory = await hre.ethers.getContractFactory("MultisigFactory");
    const multisigFactory = await MultisigFactory.deploy();

    return { multisigFactory, owner, adr1, adr2, adr3 };
  }


  describe("createMultisigWallet", function (){
    it("Should create a multisign wallet", async ()=>{
        const {multisigFactory, owner, adr1, adr2, adr3} = await loadFixture(deployMultisigFactory);
        const quorum= 3;
        const validSigners = [adr1, adr2, adr3]
        await multisigFactory.connect(owner).createMultisigWallet(quorum, validSigners)
         expect( multisigFactory.getMultiSigClones.length);
    })
  })
});