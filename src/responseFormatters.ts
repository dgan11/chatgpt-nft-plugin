import { NFT, Owner } from "./types";

export function formatNFTResponse(nfts: NFT[]) {

  return nfts.map(nft => ({
    contractAddress: nft.contract.address,
    name: nft.contract.name,
    tokenType: nft.tokenType,
    tokenId: nft.tokenId,
  }));
}

export function formatOwnersResponse(owners: Owner[]) {

  return owners.map(owner => {
    const numTokensOwned = owner.tokenBalances.reduce((sum, token) => sum + token.balance, 0);

    return {
      ownerAddress: owner.ownerAddress,
      tokenBalances: owner.tokenBalances.map(token => ({
        tokenId: parseInt(token.tokenId, 16).toString(), // Convert hex to decimal string
        balance: token.balance
      })),
      numTokensOwned
    };
  });
}