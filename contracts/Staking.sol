// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./CustomErrors.sol";
import "hardhat/console.sol";

contract StakingContract is CustomErrors {
    using SafeERC20 for IERC20;

    IERC20 public ASR; // The token users will stake
    string public constant ADMIN_REFERRAL_CODE = "ASR_001324";
    address public constant ADMIN_REFERRAL_ADDRESS =
        address(0xee984A50654F2F43640D7ccD225F0e8a58FA15E5);

    enum PlanName {
        BASIC,
        SILVER,
        GOLD,
        PLATINUM
    }
    struct Plan {
        PlanName planName;
        uint256 stakedAmount;
        uint256 dailyReward;
        uint256 lastUpdateTime;
        uint256 planDurationMonths;
        uint256 levels;
    }
    mapping(address => Plan) public userStakings;
    uint256 public totalStaked;
    // @note: Users' daily reward on staked tokens only
    mapping(address => uint256) public rewards;
    //     address  to referral code
    mapping(address => string) public userReferralCode;
    //   referral code to referred users addresses
    mapping(string => address[]) public referredUsers;

    event Staked(
        address indexed userAddress,
        uint256 amount,
        address referrerAddress
    );
    event Unstaked(address indexed userAddress, uint256 amount);
    event Claimed(address indexed userAddress, uint256 amount);

    constructor(address _ASRAddress) {
        ASR = IERC20(_ASRAddress);
        userReferralCode[ADMIN_REFERRAL_ADDRESS] = ADMIN_REFERRAL_CODE;
    }

    function getReferredUsers(
        string memory _referralCode
    ) public view returns (address[] memory) {
        return referredUsers[_referralCode];
    }

    function getReward(address _userAddress) public view returns (uint256) {
        Plan memory userPlan = userStakings[_userAddress];
        if (userPlan.stakedAmount == 0) return 0;
        else
            return
                rewards[_userAddress] +
                getDailyReward(_userAddress) +
                calculateLevelsReward(_userAddress);
    }

    function stake(
        uint256 _amount,
        string memory _referralCode,
        address _referrerAddress
    ) external {
        if (_amount < 100 * 10 ** 18) revert LowAmountToStake();

        uint256 balance = ASR.balanceOf(msg.sender);
        if (balance < _amount) revert LowASRBalance();

        Plan memory existingPlan = userStakings[msg.sender];
        if (existingPlan.stakedAmount != 0 && existingPlan.levels != 0)
            revert StakingAlreadyExists();

        PlanName plan = identifyPlan(_amount);
        if (plan == PlanName.BASIC) {
            Plan memory userPlan = Plan(
                plan,
                _amount,
                56,
                block.timestamp,
                12 * 30 days,
                5
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.SILVER) {
            Plan memory userPlan = Plan(
                plan,
                _amount,
                60,
                block.timestamp,
                14 * 30 days,
                10
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.GOLD) {
            Plan memory userPlan = Plan(
                plan,
                _amount,
                64,
                block.timestamp,
                16 * 30 days,
                15
            );
            userStakings[msg.sender] = userPlan;
        } else if (plan == PlanName.PLATINUM) {
            Plan memory userPlan = Plan(
                plan,
                _amount,
                67,
                block.timestamp,
                18 * 30 days,
                20
            );
            userStakings[msg.sender] = userPlan;
        }

        ASR.safeTransferFrom(msg.sender, address(this), _amount);
        totalStaked += _amount;

        // Handle referrer and it's code
        handleReference(_amount, _referralCode, _referrerAddress);

        emit Staked(msg.sender, _amount, _referrerAddress);
    }

    function updateStaking(uint256 amount) external {
        Plan memory existingPlan = userStakings[msg.sender];

        if (existingPlan.stakedAmount == 0 && existingPlan.lastUpdateTime == 0)
            revert NoStakingExists();

        uint256 balance = ASR.balanceOf(msg.sender);
        if (balance < amount) revert LowASRBalance();

        ASR.transferFrom(msg.sender, address(this), amount);

        // @note calculate reward util now
        rewards[msg.sender] += getDailyReward(msg.sender);

        console.log("before: ", existingPlan.stakedAmount);
        existingPlan.stakedAmount += amount;
        existingPlan.lastUpdateTime = block.timestamp;
        totalStaked += amount;

        // @note update other feilds
        PlanName newPlanName = identifyPlan(existingPlan.stakedAmount);
        existingPlan.planName = newPlanName;

        if (newPlanName == PlanName.BASIC) {
            existingPlan.planDurationMonths = 12 * 30 days;
            existingPlan.dailyReward = 56;
            existingPlan.levels = 5;
        } else if (newPlanName == PlanName.SILVER) {
            existingPlan.planDurationMonths = 14 * 30 days;
            existingPlan.dailyReward = 60;
            existingPlan.levels = 10;
        } else if (newPlanName == PlanName.GOLD) {
            existingPlan.planDurationMonths = 16 * 30 days;
            existingPlan.dailyReward = 64;
            existingPlan.levels = 15;
        } else if (newPlanName == PlanName.PLATINUM) {
            existingPlan.planDurationMonths = 20 * 30 days;
            existingPlan.dailyReward = 67;
            existingPlan.levels = 20;
        }
        userStakings[msg.sender] = existingPlan;
    }

    function unstake() external {
        Plan memory userPlan = userStakings[msg.sender];
        if (userPlan.stakedAmount == 0 && userPlan.lastUpdateTime == 0)
            revert NoStakingExists();

        if (
            block.timestamp <
            userPlan.lastUpdateTime + userPlan.planDurationMonths
        ) revert StakingPlanDurationsError();

        // Calculate Rewards by adding previous reward, daily reward and levels' earning reward.
        uint256 totalReward = rewards[msg.sender] +
            getDailyReward(msg.sender) +
            calculateLevelsReward(msg.sender);

        delete userStakings[msg.sender];
        rewards[msg.sender] = 0;

        totalStaked -= userPlan.stakedAmount;

        ASR.transfer(msg.sender, userPlan.stakedAmount + totalReward);

        emit Unstaked(msg.sender, userPlan.stakedAmount);
    }

    function identifyPlan(
        uint256 amount
    ) internal pure returns (PlanName planName) {
        console.log("am: ", amount);
        if (amount >= 100 * 10 ** 18 && amount <= 1000 * 10 ** 18)
            return PlanName.BASIC;
        else if (amount > 1000 * 10 ** 18 && amount <= 5000 * 10 ** 18)
            return PlanName.SILVER;
        else if (amount > 5000 * 10 ** 18 && amount <= 20000 * 10 ** 18)
            return PlanName.GOLD;
        else if (amount > 20000 * 10 ** 18 && amount <= 50000 * 10 ** 18)
            return PlanName.PLATINUM;
    }

    function getDailyReward(address _address) public view returns (uint256) {
        Plan memory userPlan = userStakings[_address];
        uint256 totalDays = (block.timestamp - userPlan.lastUpdateTime) /
            24 hours; // 24 hours = 86400 seconds
        if (totalDays < 1) return 0;
        return
            totalDays *
            getPercentageForDaily(userPlan.dailyReward, userPlan.stakedAmount);
    }

    function getbatchDailyReward(
        address[] memory _addresses
    ) public view returns (uint256[] memory) {
        uint256[] memory batchRewards = new uint256[](_addresses.length);
        for (uint i = 0; i < _addresses.length; i++) {
            batchRewards[i] = getDailyReward(_addresses[i]);
        }
        return batchRewards;
    }

    function calculateLevelsReward(
        address _userAddress
    ) public view returns (uint256) {
        string memory referralCode = userReferralCode[_userAddress];
        address[] memory _addresses = referredUsers[referralCode];
        uint256[] memory levelsBatchRewards = getbatchDailyReward(_addresses);
        uint256 collectiveLevelsReward;
        for (uint i = 0; i < levelsBatchRewards.length; i++) {
            uint256 percentOnLevel = getPercentOnLevel(i);
            collectiveLevelsReward += getPercentageForLevel(
                percentOnLevel,
                levelsBatchRewards[i]
            );
        }

        return collectiveLevelsReward;
    }

    function claimReward() external {
        calculateLevelsReward(msg.sender);
        uint256 rewardAmount = rewards[msg.sender];
        require(rewardAmount > 0, "No rewards to claim");

        Plan memory userPlan = userStakings[msg.sender];
        userPlan.lastUpdateTime = block.timestamp;

        delete rewards[msg.sender];
        ASR.transfer(msg.sender, rewardAmount);

        emit Claimed(msg.sender, rewardAmount);
    }

    // *********************************** Internal Functions ***********************************

    function handleReference(
        uint256 _amount,
        string memory _referralCode,
        address _referrerAddress
    ) internal {
        if (_referrerAddress == address(0) && isStringEmpty(_referralCode)) {
            _referralCode = ADMIN_REFERRAL_CODE;
            _referrerAddress = ADMIN_REFERRAL_ADDRESS;
        }

        // Check for the existing referral code and referrer
        string memory referrerCode = userReferralCode[_referrerAddress];
        if (isStringEmpty(referrerCode)) {
            userReferralCode[_referrerAddress] = _referralCode;
            referrerCode = userReferralCode[_referrerAddress];
        }

        if (
            userStakings[_referrerAddress].levels == 0 ||
            referredUsers[referrerCode].length <
            userStakings[_referrerAddress].levels
        ) {
            referredUsers[referrerCode].push(msg.sender);
        }

        // Add the referrer reward based on the level
        uint256 referrerReward = getPercentageForLevel(
            getPercentOnLevel(referredUsers[referrerCode].length - 1),
            _amount
        );
        rewards[_referrerAddress] += referrerReward;
    }

    function getPercentOnLevel(
        uint256 _level
    ) public pure returns (uint256 percent) {
        if (_level == 0) return 10;
        else if (_level == 1) return 6;
        else if (_level == 2) return 3;
        else if (_level == 3 || _level == 4) return 2;
        else if (_level > 4 || _level < 14) return 1;
        else if (_level == 14 || _level == 15) return 2;
        else if (_level == 16 || _level == 17) return 3;
        else if (_level == 18 || _level == 19) return 4;
    }

    function getPercentageForDaily(
        uint256 dailRewardPerc,
        uint256 stakedAmount
    ) internal pure returns (uint256) {
        return (dailRewardPerc * stakedAmount) / 10000;
    }

    function getPercentageForLevel(
        uint256 rewardPerc,
        uint256 totalAmount
    ) internal pure returns (uint256) {
        return (rewardPerc * totalAmount) / 100;
    }

    function isStringEmpty(string memory str) public pure returns (bool) {
        // Compare the length of the string to zero
        return bytes(str).length == 0;
    }
}
