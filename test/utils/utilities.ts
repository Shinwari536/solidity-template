import hre from "hardhat";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, Signer, Contract } from "ethers";



export const getTime = async (): Promise<number> => {
    return (await hre.ethers.provider.getBlock("latest")).timestamp
}

export async function increaseTime(duration: number): Promise<void> {
    ethers.provider.send("evm_increaseTime", [duration]);
    ethers.provider.send("evm_mine", []);
}

export const referralCodes = {
    addr1Ref: "ADDR_001",
    addr2Ref: "ADDR_002",
    addr3Ref: "ADDR_003",
    addr4Ref: "ADDR_004",
    addr5Ref: "ADDR_005",
    addr6Ref: "ADDR_006",
}
