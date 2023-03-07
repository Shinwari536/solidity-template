import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";

import { getTime, hashOrder, hashToSign, Identities, makeOrder, matchOrder } from "../utils/utilities";

describe("Test Token", function () {

  let signers: Signer[];

  let testTokenInstance: Contract;



  before(async () => {
    signers = await ethers.getSigners();

    hre.tracer.nameTags[await signers[0].getAddress()] = "ADMIN";
    hre.tracer.nameTags[await signers[1].getAddress()] = "USER1";

    const TestToken = await ethers.getContractFactory("TestToken", signers[0]);

    testTokenInstance = await TestToken.deploy();
    hre.tracer.nameTags[testTokenInstance.address] = "TEST-TOKEN";
  });


  it("should allow simple array replacement", async function () {
    expect(await testTokenInstance.callStatic.balanceOf(await signers.getAddress())).to.be.equal("0x00")
  })


});