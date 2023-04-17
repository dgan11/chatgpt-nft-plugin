## ChatGPT Plugin to get real time NFT data

This is a backend API for fetching NFT data that plugs into ChatGPT plugins.

hosted at:
https://gpt-nft-plugin.herokuapp.com/

api routes documented at:
https://app.swaggerhub.com/apis-docs/DGAN979_1/chatgpt-nft-plugin/v1

## Examples of Questions to Ask
- find all contracts by dgphoto.eth
  - For each contract, find the tokenholders for each as well as the number of tokens they hold
  - Create a csv allowlist for all my holders across all contracts. Each address should appear once and their quantity is the total number of tokens they hold across all contracts
- what is the floor price of a Bored Ape?
- find all nfts owned by dgphoto.eth
- get all minted nfts by dgphoto.eth
- Refresh nft metadata for my token 0xa724fcd797f7ed2a7aae8c486ce49f29ccae4525/1


## Run Locally
```
yarn dev
```

## Routes to hit
```
// get all contracts created by dgphoto.eth
https://gpt-nft-plugin.herokuapp.com/contracts/dgphoto.eth/created


```
