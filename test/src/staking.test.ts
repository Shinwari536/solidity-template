import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import asr_abi from "../utils/asr-abi.json";
function increaseTime(duration: number) {
  ethers.provider.send("evm_increaseTime", [duration]);
  ethers.provider.send("evm_mine", []);
}
import { referralCodes } from "../utils/utilities";
describe("ASR Staking Smart Contract", function () {
  // address
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addr3: Signer;
  let addr4: Signer;
  let addr5: Signer;
  let addr6: Signer;
  let stakingInstance: Contract;
  let asrInstance: Contract;
  const ASR_ADDRESS = "0xfbc26841c173e9cce7be7c811cb8fe06289be820";

  before(async () => {
    [
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
      addr5,
      addr6,
    ] = await ethers.getSigners();

    const ASR = await ethers.getContractFactory("ASR", owner);
    asrInstance = await ASR.deploy();

    const StakingContract = await ethers.getContractFactory(
      "StakingContract",
      owner
    );
    stakingInstance = await StakingContract.deploy(asrInstance.address);
  });

  it("Transfer & Approve ASR to other address", async function () {
    await Promise.all([
      asrInstance.transfer(await addr1.getAddress(), parseEther("500000")),
      asrInstance.transfer(await addr2.getAddress(), parseEther("5000000")),
      asrInstance.transfer(await addr3.getAddress(), parseEther("50000")),
      asrInstance.transfer(await addr4.getAddress(), parseEther("2000")),
    ]);

    await Promise.all([
      asrInstance
        .connect(addr1)
        .approve(stakingInstance.address, parseEther("500000")),
      asrInstance
        .connect(addr2)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr3)
        .approve(stakingInstance.address, parseEther("50000")),
      asrInstance
        .connect(addr4)
        .approve(stakingInstance.address, parseEther("20000")),
      asrInstance
        .connect(addr5)
        .approve(stakingInstance.address, parseEther("500000")),
      asrInstance
        .connect(addr6)
        .approve(stakingInstance.address, parseEther("500000")),
    ]);

    console.log(
      await asrInstance.balanceOf(await addr1.getAddress()),
      "addr1 Balance",
      // stakingInstance.functions
    );

    expect(await asrInstance.balanceOf(await addr1.getAddress())).to.be.equal(
      parseEther("500000")
    );
  });

  describe("Staking ASR TOKENS", function () {
    it("Stake token to buy plan Basic", async function () {
      stakingInstance
        .connect(addr4)
        .stake(
          parseEther("1000"),
          referralCodes.addr3Ref,
          await addr3.getAddress()
        );
      // console.log(await stakingInstance.userStakings(await addr4.getAddress()));
      console.log("addr4: ", await addr4.getAddress());
      
      console.log("addr3 referred Users: ", await stakingInstance.getReferredUsers(await addr3.getAddress()));
      
    });
  });
});
