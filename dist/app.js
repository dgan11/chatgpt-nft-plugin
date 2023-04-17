"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const alchemy_sdk_1 = require("alchemy-sdk");
// Load environment variables from the .env file
dotenv_1.default.config();
// Initalize Alchemy
const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: alchemy_sdk_1.Network.ETH_MAINNET,
};
const alchemy = new alchemy_sdk_1.Alchemy(config);
const app = (0, express_1.default)();
const port = 3002;
// Enable CORS for all routes
app.use((0, cors_1.default)({ origin: '*' }));
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Serve static files from the "public" directory
app.use(express_1.default.static('public'));
app.get('/test', (req, res) => {
    res.send('test!');
});
//async app.get
// Test
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const latestBlock = yield alchemy.core.getBlockNumber();
    res.send('latest block: ' + latestBlock);
}));
// Get current gas price
app.get('/gas', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const gasPrice = yield alchemy.core.getGasPrice();
    res.send('current gas price: ' + gasPrice);
}));
// Refresh metadata for a given contract and token
app.get('/refresh/:contractAddress/:tokenId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contractAddress = req.params.contractAddress.toLowerCase();
    const tokenId = req.params.tokenId;
    const response = yield alchemy.nft.refreshNftMetadata(contractAddress, tokenId);
    return res.status(200).json(response);
}));
// Get floor price of an nft
app.get('/nft/:contractAddress/floor', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contractAddress = req.params.contractAddress.toLowerCase();
    const floorPrice = yield alchemy.nft.getFloorPrice(contractAddress);
    return res.status(200).json(floorPrice);
}));
// Get all nfts owned by a wallet
app.get('/nfts/:walletAddress/owned', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const nfts = yield alchemy.nft.getNftsForOwner(walletAddress);
    return res.status(200).json(nfts);
}));
// Get all minted nfts by a wallet
app.get('/nfts/:walletAddress/minted', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const nfts = yield alchemy.nft.getMintedNfts(walletAddress);
    return res.status(200).json(nfts);
}));
// Get all owners of a given nft contract and tokenId
app.get('/contract/:contractAddress/:tokenId/owners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contractAddress = req.params.contractAddress.toLowerCase();
    const tokenId = req.params.tokenId;
    const owners = yield alchemy.nft.getOwnersForNft(contractAddress, tokenId);
    return res.status(200).json(owners);
}));
// Get all the owners for a given NFT contract + token balance
app.get('/contract/:contractAddress/owners', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const contractAddress = req.params.contractAddress.toLowerCase();
    const owners = yield alchemy.nft.getOwnersForContract(contractAddress, { withTokenBalances: true });
    return res.status(200).json(owners);
}));
// Get all contracts deployed by a wallet
function findContractsDeployed(address) {
    return __awaiter(this, void 0, void 0, function* () {
        const transfers = [];
        // Paginate through the results using getAssetTransfers method
        let response = yield alchemy.core.getAssetTransfers({
            fromBlock: "0x0",
            toBlock: "latest",
            fromAddress: address,
            excludeZeroValue: false,
            category: ["external"], // Filter results to only include contract creations
        });
        transfers.push(...response.transfers);
        // Continue fetching and aggregating results while there are more pages
        while (response.pageKey) {
            let pageKey = response.pageKey;
            response = yield alchemy.core.getAssetTransfers({
                fromBlock: "0x0",
                toBlock: "latest",
                fromAddress: address,
                excludeZeroValue: false,
                category: ["external"],
                pageKey: pageKey,
            });
            transfers.push(...response.transfers);
        }
        // Filter the transfers to only include contract deployments (where 'to' is null)
        const deployments = transfers.filter((transfer) => transfer.to === null);
        const txHashes = deployments.map((deployment) => deployment.hash);
        // Fetch the transaction receipts for each of the deployment transactions
        const promises = txHashes.map((hash) => alchemy.core.getTransactionReceipt(hash));
        // Wait for all the transaction receipts to be fetched
        const receipts = yield Promise.all(promises);
        const contractAddresses = receipts.map((receipt) => receipt === null || receipt === void 0 ? void 0 : receipt.contractAddress);
        return contractAddresses;
    });
}
app.get('/contracts/:walletAddress/created', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const walletAddress = req.params.walletAddress.toLowerCase();
    const contracts = yield findContractsDeployed(walletAddress);
    return res.status(200).json(contracts);
}));
// Serve the ai-plugin.json manifest file
app.get('/.well-known/ai-plugin.json', (req, res) => {
    // const URL = process.env.URL || 'http://localhost:3002';
    const host = req.headers.host;
    const filePath = path_1.default.join(__dirname, '.well-known', 'ai-plugin.json');
    fs_1.default.readFile(filePath, 'utf8', (err, text) => {
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
app.get('/openapi.yaml', (req, res) => {
    const filePath = path_1.default.join(__dirname, 'openapi.yaml');
    fs_1.default.readFile(filePath, 'utf8', (err, text) => {
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
