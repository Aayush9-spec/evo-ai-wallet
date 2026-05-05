
import { ethers } from "ethers";

export interface TradeRequest {
  to: string;
  value: string;
  data?: string;
}

export const executeTrade = async (signer: ethers.Signer, trade: TradeRequest) => {
  try {
    const tx = await signer.sendTransaction({
      to: trade.to,
      value: ethers.parseEther(trade.value),
      data: trade.data || "0x"
    });
    
    console.log("Transaction Sent:", tx.hash);
    return tx;
  } catch (error) {
    console.error("Trade Execution Failed:", error);
    throw error;
  }
};

export const wrapEth = async (signer: ethers.Signer, amount: string) => {
  const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Mainnet WETH
  const abi = ["function deposit() public payable"];
  const contract = new ethers.Contract(WETH_ADDRESS, abi, signer);
  
  const tx = await contract.deposit({ value: ethers.parseEther(amount) });
  return tx;
};
