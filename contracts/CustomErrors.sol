// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface CustomErrors {
   error LowAmountToStake();
   error LowASRBalance();
   error StakingAlreadyExists();
   error NoStakingExists();
   error LessThanMinimumDaysError();
   error StakingPlanDurationsError();
}