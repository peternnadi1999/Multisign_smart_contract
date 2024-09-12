import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigModule = buildModule("MultisigModule", (m) => {
  const tokenAddress = "0xe336d36FacA76840407e6836d26119E1EcE0A2b4";
  const multisig = m.contract("Multisig", [tokenAddress]);

  return { multisig };
});

export default MultisigModule;
