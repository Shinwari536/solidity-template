import { expect } from "chai";
import { Contract, BigNumber, Signer } from "ethers";
import hre, { ethers } from "hardhat";
import { parseEther } from "ethers/lib/utils";

function toReadableAmount(rawAmount: number) {
  return ethers.utils.formatUnits(rawAmount, 18);
}
const ADMIN_REFERRAL_ADDRESS = "0xee984a50654f2f43640d7ccd225f0e8a58fa15e5";
const ADMIN_REFERRAL_CODE = "ASR_001324";

import { increaseTime, referralCodes } from "../utils/utilities";
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
  let noStakingAddr: Signer;
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
      noStakingAddr,
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
      asrInstance.transfer(
        await noStakingAddr.getAddress(),
        parseEther("1000")
      ),
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
        .connect(noStakingAddr)
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
        toReadableAmount(await stakingInstance.getReward(ADMIN_REFERRAL_ADDRESS))
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
          await stakingInstance.getReward(await addr3.getAddress())
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
          await stakingInstance.getReward(await addr3.getAddress())
        )
      );
      const plan = await stakingInstance.userStakings(await addr5.getAddress());
      expect(plan.planName).to.be.equal(2); // 2 = GOLD Plan
    });

    it("Should not allow staking another amount if already exist", async function () {
      await expect(
        stakingInstance
          .connect(addr5)
          .stake(
            parseEther("15000"),
            referralCodes.addr3Ref,
            await addr3.getAddress()
          )
      ).to.be.revertedWith("StakingAlreadyExists");
    });

    it("Should not allow staking less than 100 ASR amount", async function () {
      await expect(
        stakingInstance
          .connect(addr9)
          .stake(
            parseEther("99"),
            referralCodes.addr3Ref,
            await addr3.getAddress()
          )
      ).to.be.revertedWith("LowAmountToStake");
    });
  });

  describe("Update Staking", function () {
    it("Should not allow update if no staking found", async function () {
      await expect(
        stakingInstance
          .connect(noStakingAddr)
          .updateStaking(parseEther("14688"))
      ).to.be.revertedWith("NoStakingExists");
    });

    it("Should allow update staking if user has staked ASR before", async function () {
      const planBefore = await stakingInstance.userStakings(
        await addr10.getAddress()
      );

      console.log(
        "Addr10 award before: ",
        toReadableAmount(
          await stakingInstance.getReward(await addr10.getAddress())
        ), planBefore.dailyReward
      );
      await increaseTime(86400); // 1 day

      await stakingInstance.connect(addr10).updateStaking(parseEther("10000"));
      await increaseTime(86400); // 1 day
      const planAfter = await stakingInstance.userStakings(
        await addr10.getAddress()
      );
      console.log(
        "Addr10 award after: ",
        toReadableAmount(
          await stakingInstance.getReward(await addr10.getAddress())
        ), planAfter.dailyReward
      );
      expect(planAfter.stakedAmount).to.be.equal(
        planBefore.stakedAmount.add(parseEther("10000"))
      );
    });
  });

  describe("Uns-take ASR ", function () {
    it("Should not allow un-stake ASR if no plan/staking exist", async function () {
      await expect(
        stakingInstance.connect(noStakingAddr).unstake()
      ).to.be.revertedWith("NoStakingExists");
    });
    it("Should not allow un-stake ASR before plan duration", async function () {
      await expect(stakingInstance.connect(addr3).unstake()).to.be.revertedWith(
        "StakingPlanDurationsError"
      );
    });

    it("Should allow un-stake ASR after plan duration", async function () {
      // addr5 has staked 15000 * 10**18 ASR and bought GOLD for 16 months
      const balanceBefore = await asrInstance.balanceOf(
        await addr5.getAddress()
      );
      await stakingInstance
        .connect(addr7)
        .stake(
          parseEther("1500"),
          referralCodes.addr5Ref,
          await addr5.getAddress()
        );

      await increaseTime(41889024); // seconds in 16 months
      await stakingInstance.connect(addr5).unstake();

      const balanceAfter = await asrInstance.balanceOf(
        await addr5.getAddress()
      );

      console.log(
        "Before: ",
        toReadableAmount(balanceBefore),
        "After: ",
        toReadableAmount(balanceAfter)
      );
    });
  });
});
