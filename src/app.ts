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
const port = 3002;

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

// Serve the ai-plugin.json manifest file
app.get('/.well-known/ai-plugin.json', (req: Request, res: Response) => {
  // const URL = process.env.URL || 'http://localhost:3002';

  const host = req.headers.host;
  const filePath = path.join(__dirname, '.well-known', 'ai-plugin.json');
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
  const filePath = path.join(__dirname, 'openai.yaml');
  fs.readFile(filePath, 'utf8', (err, text) => {
    if (err) {
      res.status(500).send('Error reading openai.yaml');
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
