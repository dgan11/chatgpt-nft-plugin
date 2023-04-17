import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Alchemy, Network } from "alchemy-sdk";

// Load environment variables from the .env file
dotenv.config();

// Initalize Alchemy
const config = {
  apiKey: process.env.ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(config);

const app = express();
const port = process.env.PORT || 3002;

// Enable CORS for all routes
app.use(cors({ origin: '*' }));

// Middleware to parse JSON request bodies
app.use(express.json())

// Serve static files from the "public" directory
app.use(express.static('public'));

app.get('/test', (req: Request, res: Response) => {
  res.send('test!');
})


//async app.get

// Test
app.get('/', async (req: Request, res: Response) => {
  const latestBlock = await alchemy.core.getBlockNumber();
  res.send('latest block: ' + latestBlock);
})

// Get current gas price
app.get('/gas', async (req: Request, res: Response) => {
  const gasPrice = await alchemy.core.getGasPrice();
  res.send('current gas price: ' + gasPrice);
})

// Refresh metadata for a given contract and token
app.get('/refresh/:contractAddress/:tokenId', async (req: Request, res: Response) => {
  const contractAddress = req.params.contractAddress.toLowerCase();
  const tokenId = req.params.tokenId;
  const response = await alchemy.nft.refreshNftMetadata(contractAddress, tokenId);
  return res.status(200).json(response);
})

// Get floor price of an nft
app.get('/nft/:contractAddress/floor', async (req: Request, res: Response) => { 
  const contractAddress = req.params.contractAddress.toLowerCase();
  const floorPrice = await alchemy.nft.getFloorPrice(contractAddress);
  return res.status(200).json(floorPrice);
})

// Get all nfts owned by a wallet
app.get('/nfts/:walletAddress/owned', async (req: Request, res: Response) => { 
  const walletAddress = req.params.walletAddress.toLowerCase();
  const nfts = await alchemy.nft.getNftsForOwner(walletAddress);
  return res.status(200).json(nfts);
})

// Get all minted nfts by a wallet
app.get('/nfts/:walletAddress/minted', async (req: Request, res: Response) => {
  const walletAddress = req.params.walletAddress.toLowerCase();
  const nfts = await alchemy.nft.getMintedNfts(walletAddress);
  return res.status(200).json(nfts);
})

// Get all owners of a given nft contract and tokenId
app.get('/contract/:contractAddress/:tokenId/owners', async (req: Request, res: Response) => {
  const contractAddress = req.params.contractAddress.toLowerCase();
  const tokenId = req.params.tokenId;
  const owners = await alchemy.nft.getOwnersForNft(contractAddress, tokenId);
  return res.status(200).json(owners);
})

// Get all the owners for a given NFT contract + token balance
app.get('/contract/:contractAddress/owners', async (req: Request, res: Response) => { 
  const contractAddress = req.params.contractAddress.toLowerCase();
  const owners = await alchemy.nft.getOwnersForContract(
    contractAddress, 
    { withTokenBalances: true}
  );
  return res.status(200).json(owners);
})

// Get all contracts deployed by a wallet
async function findContractsDeployed(address: string) {
  const transfers = [];
  // Paginate through the results using getAssetTransfers method
  let response = await alchemy.core.getAssetTransfers({
    fromBlock: "0x0",
    toBlock: "latest", // Fetch results up to the latest block
    fromAddress: address, // Filter results to only include transfers from the specified address
    excludeZeroValue: false, // Include transfers with a value of 0
    category: ["external" as any], // Filter results to only include contract creations
  });
  transfers.push(...response.transfers);

  // Continue fetching and aggregating results while there are more pages
  while (response.pageKey) {
    let pageKey = response.pageKey;
    response = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
      toBlock: "latest",
      fromAddress: address,
      excludeZeroValue: false,
      category: ["external" as any],
      pageKey: pageKey,
    });
    transfers.push(...response.transfers);
  }

  // Filter the transfers to only include contract deployments (where 'to' is null)
  const deployments = transfers.filter((transfer) => transfer.to === null);
  const txHashes = deployments.map((deployment) => deployment.hash);

  // Fetch the transaction receipts for each of the deployment transactions
  const promises = txHashes.map((hash) =>
    alchemy.core.getTransactionReceipt(hash)
  );

  // Wait for all the transaction receipts to be fetched
  const receipts = await Promise.all(promises);
  const contractAddresses = receipts.map((receipt) => receipt?.contractAddress);
  return contractAddresses;
}

app.get('/contracts/:walletAddress/created', async (req: Request, res: Response) => {
  const walletAddress = req.params.walletAddress.toLowerCase();
  const contracts = await findContractsDeployed(walletAddress);
  return res.status(200).json(contracts);
})
  

// Serve the ai-plugin.json manifest file
app.get('/.well-known/ai-plugin.json', (req: Request, res: Response) => {

  const host = req.headers.host;
  const filePath = path.join(__dirname, '..', '.well-known', 'ai-plugin.json');
  fs.readFile(filePath, 'utf8', (err, text) => {
    if (err) {
      res.status(500).send('Error reading ai-plugin.json');
      return;
    }
    text = text.replace('PLUGIN_HOSTNAME', `https://${host}`);
    // text = text.replace('PLUGIN_HOSTNAME', URL);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  });
});

// Serve the OpenAPI specification
app.get('/openapi.yaml', (req: Request, res: Response) => {
  const filePath = path.join(__dirname, '..', 'openapi.yaml');
  fs.readFile(filePath, 'utf8', (err, text) => {
    if (err) {
      res.status(500).send('Error reading openapi.yaml');
      return;
    }
    res.setHeader('Content-Type', 'text/yaml');
    res.send(text);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
