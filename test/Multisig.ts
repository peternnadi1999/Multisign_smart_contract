import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Multisig", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployToken() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const erc20Token = await hre.ethers.getContractFactory("Web3CXI");
    const token = await erc20Token.deploy();

    return { token };
  }

  async function deployMultisigFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, adr1, adr2, adr3, adr4] = await hre.ethers.getSigners();

    const Multisig = await hre.ethers.getContractFactory("Multisig");
    const validSigners = [owner, adr1, adr2];
    const quorum = 3;
    const multisig = await Multisig.deploy(quorum, validSigners);

    return {
      multisig,
      quorum,
      validSigners,
      adr1,
      adr4,
      adr3,
    };
  }

  describe("Deployment", function () {
    it("Check a valid signer", async () => {
      const { multisig, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      expect(validSigners.length).to.be.gt(1);
    });

    it("Check if valid signer not address zero", async () => {
      const { multisig, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      expect(validSigners[0]).not.to.be.equal(ethers.ZeroAddress);
      expect(validSigners[1]).not.to.be.equal(ethers.ZeroAddress);
      expect(validSigners[2]).not.to.be.equal(ethers.ZeroAddress);
      multisig.connect(validSigners[0]);
    });

    it("Check if quorum is less than ot equal to valid signers", async () => {
      const { multisig, validSigners, quorum } = await loadFixture(
        deployMultisigFixture
      );
      expect(quorum).to.be.lte(validSigners.length);
    });

    it("Check if quorum greater than 1", async () => {
      const { multisig, quorum } = await loadFixture(deployMultisigFixture);
      expect(quorum).to.be.gt(1);
    });

    it("Check if tx count 0", async () => {
      const { multisig } = await loadFixture(deployMultisigFixture);
      expect(await multisig.txCount()).to.be.equal(0);
    });
  });

  describe("Transfer", function () {
    it("Should check if zero address exist ", async function () {
      const { multisig, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      expect(multisig.connect(validSigners[0])).not.to.be.equal(
        ethers.ZeroAddress
      );
    });

    it("Should check for valid signer", async function () {
      const { adr1 } = await loadFixture(deployMultisigFixture);

      expect(adr1).to.be.revertedWith("invalid signer");
    });

    it("Should check if amount is zero", async function () {
      const { multisig, adr3, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      await expect(
        multisig
          .connect(validSigners[0])
          .transfer(ethers.parseUnits("0", 18), adr3, token.getAddress())
      ).to.be.revertedWith("can't send zero amount");
    });

    it("Should check if recipient is not zero address", async function () {
      const { multisig, adr3 } = await loadFixture(deployMultisigFixture);
      const { token } = await loadFixture(deployToken);
      await expect(
        multisig.transfer(
          ethers.parseUnits("10000", 18),
          ethers.ZeroAddress,
          token.getAddress()
        )
      ).to.be.revertedWith("address zero found");
    });

    it("Should check if tokenAddress is not zero address", async function () {
      const { multisig, adr3 } = await loadFixture(deployMultisigFixture);

      await expect(
        multisig.transfer(
          ethers.parseUnits("10000", 18),
          adr3,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("address zero found");
    });

    it("Should check the balance of an address ", async function () {
      const { multisig, adr3 } = await loadFixture(deployMultisigFixture);
      const { token } = await loadFixture(deployToken);
      const amount = 0;
      expect(await token.balanceOf(multisig.getAddress())).to.be.gte(amount);
    });

    it("Should create a transaction", async () => {
      const { multisig, adr3, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      let dx = await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr3, token.getAddress());
      expect(dx);

      let add = await token.balanceOf(adr3);
      console.log(add);
    });

    it("Should check for a transaction", async () => {
      const { multisig, adr3, quorum, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr3, token.getAddress());
      const tx = await multisig.transactions(1);
      expect(tx.noOfApproval).to.be.lte(quorum);
      expect(await multisig.txCount()).to.be.equal(1);
    });
  });

  describe("Approvetx", function () {
    it("should check for tx id", async () => {
      const { multisig } = await loadFixture(deployMultisigFixture);
      expect(multisig.approveTx(0)).to.be.revertedWith("invalid tx id");
    });

    it("check if insufficient funds", async () => {
      const { multisig } = await loadFixture(deployMultisigFixture);
      const { token } = await loadFixture(deployToken);
      const dx = multisig.transactions(1);
      expect(await token.balanceOf(multisig.getAddress())).to.be.gte(
        (await dx).amount
      );
    });

    it("check if transaction isComplete", async () => {
      const { multisig, validSigners, adr3 } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr3, token.getAddress());
      let dx = await multisig.transactions(1);

      await multisig.connect(validSigners[1]).approveTx(dx.id);

      dx = await multisig.transactions(1);

      expect(dx.isCompleted).to.be.false;
      expect(dx.noOfApproval).to.equal(2);

      dx = await multisig.transactions(1);

      await multisig.connect(validSigners[2]).approveTx(dx.id);

      dx = await multisig.transactions(1);

      expect(dx.isCompleted).to.be.true;
      expect(dx.noOfApproval).to.equal(3);

      dx = await multisig.transactions(1);
      expect(!dx.isCompleted).to.be.revertedWith(
        "transaction already completed"
      );
    });

    it("Should check if approval has reached ", async function () {
      const { multisig, validSigners, adr3, quorum } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr3, token.getAddress());
      const dx = await multisig.transactions(1);
      expect(dx.noOfApproval).to.be.lt(quorum);
    });

    it("Should check if it's a valid signer ", async function () {
      const { multisig, adr4, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr4, token.getAddress());
      const dx = await multisig.transactions(1);
      expect(multisig.connect(adr4).approveTx(dx.id)).to.be.revertedWith(
        "not a valid signer"
      );
    });

    it("Should check if signer have signed before ", async function () {
      const { multisig, adr3, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("10000", 18), adr3, token.getAddress());
      const dx = await multisig.transactions(1);
      expect(
        multisig.connect(validSigners[0]).approveTx(dx.id)
      ).to.be.revertedWith("can't sign twice");
    });

    it("Should tranfer the funds ", async function () {
      const { multisig, quorum, adr3, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig
        .connect(validSigners[0])
        .transfer(ethers.parseUnits("100", 18), adr3, token.getAddress());
      let dx = await multisig.transactions(1);

      await multisig.connect(validSigners[1]).approveTx(dx.id);

      dx = await multisig.transactions(1);

      expect(dx.isCompleted).to.be.false;
      expect(dx.noOfApproval).to.equal(2);

      dx = await multisig.transactions(1);

      await multisig.connect(validSigners[2]).approveTx(dx.id);

      dx = await multisig.transactions(1);
      expect(dx.noOfApproval).to.equal(3);
      expect(dx.noOfApproval).to.be.equal(quorum);
      expect(dx.isCompleted).to.be.true;
      const recipientBalance = await token.balanceOf(adr3);
      expect(recipientBalance).to.equal(ethers.parseUnits("100", 18));
    });
  });

  describe("UpdateQuorum", function () {
    it("Should check if zero address exist ", async function () {
      const { multisig, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      expect(multisig.connect(validSigners[0])).not.to.be.equal(
        ethers.ZeroAddress
      );
    });

    it("Should check for valid signer", async function () {
      const { adr1 } = await loadFixture(deployMultisigFixture);

      expect(adr1).to.be.revertedWith("invalid signer");
    });

    it("Should check if quorum is 0", async function () {
      const { multisig, validSigners } = await loadFixture(
        deployMultisigFixture
      );

      // expect(await multisig.updateQuorum(3)).to.be.gt(1);
    });

    it("Should check if it's a valid signer ", async function () {
      const { multisig, adr4, validSigners } = await loadFixture(
        deployMultisigFixture
      );
      const { token } = await loadFixture(deployToken);
      const trfAmount = ethers.parseUnits("100000", 18);
      await token.transfer(multisig.getAddress(), trfAmount);
      await multisig.connect(validSigners[0]).updateQuorum(3);
      const dx = await multisig.transactions(1);
      expect(multisig.connect(adr4).updateQuorum(dx.newQuorum)).to.be.revertedWith(
        "not a valid signer"
      );
    });
  });
});
