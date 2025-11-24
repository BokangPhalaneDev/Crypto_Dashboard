// XAU Contract integration
let xauContract;
let web3;
let usdcContract;

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
            },
            {
                "constant": false,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            }
        ],
        address: "0xMockContractAddress"
    };
}

// Initialize Web3 and contracts
async function initializeContracts(provider) {
    try {
        if (typeof window.ethereum !== 'undefined' || provider) {
            web3 = new Web3(window.ethereum || provider);
            
            const contractDetails = await loadContractDetails();
            xauContract = new web3.eth.Contract(contractDetails.abi, contractDetails.address);
            
            console.log('XAU Contract initialized:', contractDetails.address);
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

// Get current XAU price
async function getXauPrice() {
    if (!xauContract) return '0';
    
    try {
        // Quote buying 1 token to get current price
        const quote = await xauContract.methods.quoteBuy(web3.utils.toWei('1', 'mwei')).call();
        return quote.price / Math.pow(10, 6); // Assuming 6 decimals for USDC
    } catch (error) {
        console.error('Error getting XAU price:', error);
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
        
        usdcContract = new web3.eth.Contract(usdcAbi, usdcAddress);
        
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