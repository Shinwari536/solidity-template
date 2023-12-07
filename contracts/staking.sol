// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingContract is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public ASR; // The token users will stake
    IERC20 public rewardToken; // The token used to reward stakers

    uint256 public totalStaked;
    mapping(address => uint256) public lastUpdateTime;
    mapping(address => uint256) public rewards;

    enum PlanName {
        BASIC,
        SILVER,
        GOLD,
        PLATINUM
    }
    struct Plan {
        PlanName planName;
        uint256 stakedAmount;
        uint256 dailReward;
        uint256 lastUpdateTime;
        uint256 planDurationMonths;
    }
    mapping(address => Plan) public userStakings;

    uint256 public rewardRate; // Reward rate per second

    event Staked(address indexed userAddress, uint256 amount);
    event Unstaked(address indexed userAddress, uint256 amount);
    event Claimed(address indexed userAddress, uint256 amount);

    constructor(address _ASRAddress) {
        ASR = IERC20(_ASRAddress);
        rewardToken = IERC20(_ASRAddress);
    }

    function stakeASR(uint256 amount) external {
        require(amount >= 100, "Amount must be greater than 100");
        PlanName plan = identifyPlan(amount);

        if (plan == PlanName.BASIC) {
            Plan memory userPlan = Plan(
                plan,
                amount,
                56,
                block.timestamp,
                12 * 30 days
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.SILVER) {
            Plan memory userPlan = Plan(
                plan,
                amount,
                60,
                block.timestamp,
                14 * 30 days
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.GOLD) {
            Plan memory userPlan = Plan(
                plan,
                amount,
                64,
                block.timestamp,
                16 * 30 days
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.PLATINUM) {
            Plan memory userPlan = Plan(
                plan,
                amount,
                67,
                block.timestamp,
                18 * 30 days
            );
            userStakings[msg.sender] = userPlan;
        }

        // calculateReward(msg.sender);

        ASR.safeTransferFrom(msg.sender, address(this), amount);
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        Plan memory userPlan = userStakings[msg.sender];
        require(
            userPlan.stakedAmount >= amount,
            "Staked amount must be greater or equal than unstaking amount"
        );
        require(
            block.timestamp >
                userPlan.lastUpdateTime + userPlan.planDurationMonths,
            "Cannot unstake yet."
        );

        userPlan.stakedAmount -= amount;
        userPlan.lastUpdateTime = block.timestamp;
        totalStaked -= amount;
        userStakings[msg.sender] = userPlan;

        calculateLevelsReward(msg.sender);
        ASR.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    function identifyPlan(
        uint256 amount
    ) internal pure returns (PlanName planName) {
        if (amount >= 100 && amount <= 1000) return PlanName.BASIC;
        else if (amount > 1000 && amount <= 5000) return PlanName.SILVER;
        else if (amount > 5000 && amount <= 20000) return PlanName.GOLD;
        else if (amount > 20000 && amount <= 50000) return PlanName.PLATINUM;
    }

    function getDailyReward(address _address) external view returns (uint256) {
        Plan memory userPlan = userStakings[_address];
        uint256 totalDays = (block.timestamp - userPlan.lastUpdateTime) /
            24 hours; // 24 hours = 86400 seconds
        require(totalDays >= 1, "Wait for a day to Get reward");
        return
            totalDays *
            getPercentage(userPlan.dailReward, userPlan.stakedAmount);
    }

    function getPercentage(
        uint256 dailRewardPerc,
        uint256 stakedAmount
    ) internal pure returns (uint256) {
        return (dailRewardPerc * stakedAmount) / 100;
    }

    function claim() external {
        calculateLevelsReward(msg.sender);
        uint256 rewardAmount = rewards[msg.sender];
        require(rewardAmount > 0, "No rewards to claim");

        rewards[msg.sender] = 0;
        rewardToken.safeTransfer(msg.sender, rewardAmount);

        emit Claimed(msg.sender, rewardAmount);
    }

    function calculateLevelsReward(address account) internal {
        Plan memory userPlan = userStakings[msg.sender];

        uint256 currentTime = block.timestamp;
        uint256 lastUpdate = userPlan.lastUpdateTime;

        if (currentTime > lastUpdate) {
            uint256 timeElapsed = currentTime - lastUpdate;
            uint256 reward = userPlan.stakedAmount *
                userPlan.dailReward *
                timeElapsed;
            rewards[account] += reward;
            lastUpdateTime[account] = currentTime;
        }
    }

    // @note : Do we need to update the reward rate for each plan
    // function setRewardRate(uint256 _rewardRate) external onlyOwner {
    //     rewardRate = _rewardRate;
    // }
}
