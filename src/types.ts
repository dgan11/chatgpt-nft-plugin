export interface NFT {
  contract: {
    address: string;
    name: string;
  };
  tokenType: string;
  tokenId: string;
  rawMetadata: {
    image: string;
  };
  balance: number;
}

export interface Owner {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: number;
  }[];
}
