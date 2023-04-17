## ChatGPT Plugin to get real time NFT data

This is a backend API for fetching NFT data that plugs into ChatGPT plugins.

### Examples of Questions to Ask
- find all contracts by ligmajohn.eth
  - For each contract, find the tokenholders for each as well as the number of tokens they hold
  - Create a csv allowlist for all my holders across all contracts. Each address should appear once and their quantity is the total number of tokens they hold across all contracts
- what is the floor price of a Bored Ape?
- find all nfts owned by dgphoto.eth
- get all minted nfts by dgphoto.eth
- Refresh nft metadata for my token 0xa724fcd797f7ed2a7aae8c486ce49f29ccae4525/1



### Start
```
yarn dev
```