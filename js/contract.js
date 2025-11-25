// XAU Contract integration with real prices
let xauContract, web3, priceFeedContract;

// Load contract details from JSON file
async function loadContractDetails() {
    try {
        const response = await fetch('./contracts/xau_contract_details.json');
        const contractDetails = await response.json();
        
        return {
            abi: contractDetails.abi,
            address: contractDetails.contract_address
        };
    } catch (error) {
        console.error('Error loading contract details:', error);
        return getMockContractDetails();
    }
}

// Mock data fallback
function getMockContractDetails() {
    return {
        abi: [
            {
                "constant": true,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            }
        ],
        address: "0xMockContractAddress"
    };
}

// Initialize Web3 and contracts with price feed
async function initializeContracts(provider) {
    try {
        if (typeof window.ethereum !== 'undefined' || provider) {
            web3 = new Web3(window.ethereum || provider);
            
            const contractDetails = await loadContractDetails();
            xauContract = new web3.eth.Contract(contractDetails.abi, contractDetails.address);
            
            // Initialize price feed
            await initializePriceFeed();
            
            console.log('XAU Contract and Price Feed initialized');
            return true;
        } else {
            console.error('No Ethereum provider found');
            return false;
        }
    } catch (error) {
        console.error('Error initializing contracts:', error);
        return false;
    }
}

// Initialize the Chainlink price feed
async function initializePriceFeed() {
    try {
        const priceFeedAddress = await xauContract.methods.PRICE_FEED().call();
        
        // Chainlink Aggregator V3 Interface ABI
        const priceFeedABI = [
            {
                "inputs": [],
                "name": "latestRoundData",
                "outputs": [
                    {"name": "roundId", "type": "uint80"},
                    {"name": "answer", "type": "int256"},
                    {"name": "startedAt", "type": "uint256"},
                    {"name": "updatedAt", "type": "uint256"},
                    {"name": "answeredInRound", "type": "uint80"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        priceFeedContract = new web3.eth.Contract(priceFeedABI, priceFeedAddress);
        console.log('Price feed initialized:', priceFeedAddress);
        return true;
    } catch (error) {
        console.error('Error initializing price feed:', error);
        return false;
    }
}

// Get real-time XAU price from Chainlink
async function getXauPrice() {
    if (!priceFeedContract) {
        console.log('Price feed not available, using fallback');
        return await getXauPriceFallback();
    }
    
    try {
        const roundData = await priceFeedContract.methods.latestRoundData().call();
        const decimals = await priceFeedContract.methods.decimals().call();
        
        // Convert to proper decimal format
        const price = roundData.answer / Math.pow(10, decimals);
        console.log('Live XAU price:', price);
        return price;
        
    } catch (error) {
        console.error('Error getting price from feed:', error);
        return await getXauPriceFallback();
    }
}

// Fallback: Get price from contract's quote function
async function getXauPriceFallback() {
    if (!xauContract) return 1950.00; // Default gold price
    
    try {
        const quote = await xauContract.methods.quoteBuy(web3.utils.toWei('1', 'mwei')).call();
        const price = quote.price / Math.pow(10, 6); // USDC decimals
        console.log('Fallback XAU price:', price);
        return price;
    } catch (error) {
        console.error('Error getting price from quote:', error);
        return 1950.00; // Final fallback
    }
}

// Get XAU token balance
async function getXauBalance(walletAddress) {
    if (!xauContract) {
        console.error('Contract not initialized');
        return '0';
    }
    
    try {
        const balance = await xauContract.methods.balanceOf(walletAddress).call();
        const decimals = await xauContract.methods.decimals().call();
        
        // Convert from smallest unit to tokens
        return balance / Math.pow(10, decimals);
    } catch (error) {
        console.error('Error getting XAU balance:', error);
        return '0';
    }
}

// Buy XAU tokens with USDC
async function buyXau(usdcAmount) {
    if (!xauContract) {
        console.error('Contract not initialized');
        return { success: false, error: 'Contract not initialized' };
    }
    
    try {
        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];
        
        // Convert USDC amount to wei (USDC has 6 decimals)
        const usdcAmountWei = web3.utils.toWei(usdcAmount.toString(), 'mwei');
        
        // First, we need to approve USDC spending
        const usdcAddress = await xauContract.methods.USDC().call();
        const usdcAbi = [
            {
                "constant": false,
                "inputs": [
                    {"name": "spender", "type": "address"},
                    {"name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ];
        
        const usdcContract = new web3.eth.Contract(usdcAbi, usdcAddress);
        
        // Approve USDC spending
        await usdcContract.methods.approve(xauContract.options.address, usdcAmountWei).send({
            from: userAddress
        });
        
        // Execute buy
        const result = await xauContract.methods.buy(usdcAmountWei).send({
            from: userAddress
        });
        
        return { success: true, transactionHash: result.transactionHash };
        
    } catch (error) {
        console.error('Error buying XAU:', error);
        return { success: false, error: error.message };
    }
}

// Sell XAU tokens for USDC
async function sellXau(tokenAmount) {
    if (!xauContract) {
        console.error('Contract not initialized');
        return { success: false, error: 'Contract not initialized' };
    }
    
    try {
        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];
        
        // Get token decimals
        const decimals = await xauContract.methods.decimals().call();
        const tokenAmountWei = tokenAmount * Math.pow(10, decimals);
        
        // Execute sell
        const result = await xauContract.methods.sell(tokenAmountWei.toString()).send({
            from: userAddress
        });
        
        return { success: true, transactionHash: result.transactionHash };
        
    } catch (error) {
        console.error('Error selling XAU:', error);
        return { success: false, error: error.message };
    }
}

// Make functions globally available
window.initializeContracts = initializeContracts;
window.getXauBalance = getXauBalance;
window.getXauPrice = getXauPrice;
window.buyXau = buyXau;
window.sellXau = sellXau;