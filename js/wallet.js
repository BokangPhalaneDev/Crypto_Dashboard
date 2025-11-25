// Wallet connection functionality with real-time data
async function connectWallet() {
    if (!window.walletConnected) {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Request account access
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                const userAddress = accounts[0];
                
                // Initialize contracts with real data
                const contractsInitialized = await window.initializeContracts(window.ethereum);
                
                if (contractsInitialized) {
                    // Get real XAU balance and price
                    const xauBalance = await window.getXauBalance(userAddress);
                    const xauPrice = await window.getXauPrice(); // REAL price from Chainlink
                    
                    window.walletConnected = true;
                    window.connectWalletBtn.textContent = 'Disconnect';
                    window.walletAddressEl.textContent = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
                    window.walletAddressEl.style.display = 'block';
                    
                    // Update with real data
                    window.balance = xauBalance * xauPrice;
                    window.profitLoss = 0; // You'll need transaction history to calculate this
                    window.updateUI();
                    
                    // Update portfolio with real data
                    window.portfolioDetails.innerHTML = `
                        <p><strong>XAU Balance:</strong> ${xauBalance.toFixed(4)} tokens</p>
                        <p><strong>Current Price:</strong> $${xauPrice.toFixed(2)}</p>
                        <p><strong>Total Value:</strong> $${(xauBalance * xauPrice).toFixed(2)}</p>
                        <p><small>Prices update every 30 seconds</small></p>
                    `;
                    
                    // Start real-time price updates
                    setTimeout(() => {
                        if (window.startPriceUpdates) {
                            window.startPriceUpdates();
                        }
                    }, 1000);
                    
                    console.log('Wallet connected with real data');
                } else {
                    // Fallback to mock if contract initialization fails
                    connectWalletMock();
                }
                
            } catch (error) {
                console.error('User rejected connection:', error);
                connectWalletMock();
            }
        } else {
            // No Ethereum provider, use mock
            connectWalletMock();
        }
    } else {
        disconnectWallet();
    }
}

// Mock connection fallback
function connectWalletMock() {
    window.walletConnected = true;
    window.connectWalletBtn.textContent = 'Disconnect';
    window.walletAddressEl.textContent = '0x1a2b3c4d...Mock';
    window.walletAddressEl.style.display = 'block';
    
    // Use realistic mock data
    window.balance = 1250.75;
    window.profitLoss = 150.25;
    window.updateUI();
    
    window.portfolioDetails.innerHTML = `
        <p><strong>XAU:</strong> 12.5 tokens</p>
        <p><strong>Value:</strong> $1250.75</p>
        <p><small>Mock data - connect real wallet for live prices</small></p>
    `;
    
    console.log('Wallet connected with mock data');
}

function disconnectWallet() {
    window.walletConnected = false;
    window.connectWalletBtn.textContent = 'Connect Wallet';
    window.walletAddressEl.style.display = 'none';
    window.balance = 0;
    window.profitLoss = 0;
    window.updateUI();
    window.portfolioDetails.innerHTML = '<p>Connect your wallet to view portfolio details</p>';
    
    // Stop price updates
    if (window.stopPriceUpdates) {
        window.stopPriceUpdates();
    }
    
    console.log('Wallet disconnected');
}

// Make function globally available
window.connectWallet = connectWallet;