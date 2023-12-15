import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";
import asr_abi from "../utils/asr-abi.json";
function increaseTime(duration: number) {
  ethers.provider.send("evm_increaseTime", [duration]);
  ethers.provider.send("evm_mine", []);
}

function toReadableAmount(rawAmount: number) {
  return ethers.utils.formatUnits(rawAmount, 18).slice(0, 4);
}
const ADMIN_REFERRAL_ADDRESS = "0xee984a50654f2f43640d7ccd225f0e8a58fa15e5";
const ADMIN_REFERRAL_CODE = "ASR_001324";

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
  let addr7: Signer;
  let addr8: Signer;
  let addr9: Signer;
  let addr10: Signer;
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
      addr7,
      addr8,
      addr9,
      addr10,
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
      asrInstance.transfer(await addr5.getAddress(), parseEther("40000")),
      asrInstance.transfer(await addr6.getAddress(), parseEther("2000")),
      asrInstance.transfer(await addr7.getAddress(), parseEther("20000")),
      asrInstance.transfer(await addr8.getAddress(), parseEther("1000")),
      asrInstance.transfer(await addr9.getAddress(), parseEther("500")),
      asrInstance.transfer(await addr10.getAddress(), parseEther("200000")),
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
        .approve(stakingInstance.address, parseEther("500000")),
      asrInstance
        .connect(addr4)
        .approve(stakingInstance.address, parseEther("200000")),
      asrInstance
        .connect(addr5)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr6)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr7)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr8)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr9)
        .approve(stakingInstance.address, parseEther("5000000")),
      asrInstance
        .connect(addr10)
        .approve(stakingInstance.address, parseEther("5000000")),
    ]);

    console.log(
      await asrInstance.balanceOf(await addr1.getAddress()),
      "addr1 Balance"
      // stakingInstance.functions
    );

    expect(await asrInstance.balanceOf(await addr1.getAddress())).to.be.equal(
      parseEther("500000")
    );
  });

  describe("Staking ASR TOKENS", function () {
    it("Admin should be referrer in case of no referrer", async function () {
      await stakingInstance
        .connect(addr3)
        .stake(
          parseEther("50000"),
          "",
          "0x0000000000000000000000000000000000000000"
        );
      await stakingInstance
        .connect(addr10)
        .stake(
          parseEther("500"),
          "",
          "0x0000000000000000000000000000000000000000"
        );

      console.log(
        "Admin referred Users: ",
        await stakingInstance.getReferredUsers(referralCodes.adminRef)
      );

      console.log(
        "Admin award: ",
        toReadableAmount(await stakingInstance.rewards(ADMIN_REFERRAL_ADDRESS))
      );
    });

    it("Stake token to buy plan BASIC", async function () {
      await stakingInstance
        .connect(addr4)
        .stake(
          parseEther("1000"),
          referralCodes.addr3Ref,
          await addr3.getAddress()
        );
      
      console.log(
        "addr3 referred Users: ",
        await stakingInstance.getReferredUsers(referralCodes.addr3Ref)
      );

      console.log(
        "addr3 award: ",
        toReadableAmount(
          await stakingInstance.rewards(await addr3.getAddress())
        )
      );
      const plan = await stakingInstance.userStakings(await addr4.getAddress());
      // console.log("Plan: ", plan.planName);
      expect(plan.planName).to.be.equal(0); // 0 = BASIC Plan
    });

    it("Stake token to buy plan GOLD", async function () {
      await stakingInstance
        .connect(addr5)
        .stake(
          parseEther("15000"),
          referralCodes.addr3Ref,
          await addr3.getAddress()
        );
      
      console.log(
        "addr3 referred Users: ",
        await stakingInstance.getReferredUsers(referralCodes.addr3Ref)
      );

      console.log(
        "addr3 award: ",
        toReadableAmount(
          await stakingInstance.rewards(await addr3.getAddress())
        )
      );
      const plan = await stakingInstance.userStakings(await addr5.getAddress());
      console.log("Plan: ", plan.planName);
      expect(plan.planName).to.be.equal(2); // 0 = BASIC Plan
    });
  });
});
