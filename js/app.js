// Global variables shared between files
window.walletConnected = false;
window.balance = 0;
window.profitLoss = 0;
window.transactions = [];

// DOM Elements (make them global)
window.connectWalletBtn = document.getElementById('connectWallet');
window.walletAddressEl = document.getElementById('walletAddress');
window.totalBalanceEl = document.getElementById('totalBalance');
window.profitLossEl = document.getElementById('profitLoss');
window.portfolioDetails = document.getElementById('portfolioDetails');

// Main application logic
let transactions = [];

// DOM Elements
const buyBtn = document.getElementById('buyBtn');
const sellBtn = document.getElementById('sellBtn');
const buyModal = document.getElementById('buyModal');
const sellModal = document.getElementById('sellModal');
const closeBuyModal = document.getElementById('closeBuyModal');
const closeSellModal = document.getElementById('closeSellModal');
const confirmBuy = document.getElementById('confirmBuy');
const confirmSell = document.getElementById('confirmSell');
const buyAmount = document.getElementById('buyAmount');
const sellAmount = document.getElementById('sellAmount');
const transactionList = document.getElementById('transactionList');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    window.connectWalletBtn.addEventListener('click', window.connectWallet);
    
    buyBtn.addEventListener('click', () => {
        if (!window.walletConnected) {
            alert('Please connect your wallet first');
            return;
        }
        buyModal.style.display = 'flex';
    });

    sellBtn.addEventListener('click', () => {
        if (!window.walletConnected) {
            alert('Please connect your wallet first');
            return;
        }
        sellModal.style.display = 'flex';
    });

    // Close modals
    closeBuyModal.addEventListener('click', () => {
        buyModal.style.display = 'none';
    });

    closeSellModal.addEventListener('click', () => {
        sellModal.style.display = 'none';
    });

    // Confirm transactions
    confirmBuy.addEventListener('click', executeBuy);
    confirmSell.addEventListener('click', executeSell);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === buyModal) {
            buyModal.style.display = 'none';
        }
        if (e.target === sellModal) {
            sellModal.style.display = 'none';
        }
    });
});

// Update UI with current data
function updateUI() {
    window.totalBalanceEl.textContent = `$${window.balance.toFixed(2)}`;
    
    if (window.profitLoss >= 0) {
        window.profitLossEl.textContent = `+$${window.profitLoss.toFixed(2)}`;
        window.profitLossEl.className = 'profit-loss profit';
    } else {
        window.profitLossEl.textContent = `-$${Math.abs(window.profitLoss).toFixed(2)}`;
        window.profitLossEl.className = 'profit-loss loss';
    }
    
    updateTransactionList();
}

// Update transaction list
function updateTransactionList() {
    if (window.transactions.length === 0) {
        transactionList.innerHTML = '<li class="transaction-item"><span>No transactions yet</span></li>';
    } else {
        transactionList.innerHTML = window.transactions.map(transaction => `
            <li class="transaction-item">
                <span class="transaction-type ${transaction.type === 'buy' ? 'transaction-buy' : 'transaction-sell'}">
                    ${transaction.type.toUpperCase()}
                </span>
                <span>${transaction.amount} ${transaction.asset}</span>
                <span>$${transaction.value.toFixed(2)}</span>
                <span>${transaction.date}</span>
            </li>
        `).join('');
    }
}

// Execute buy transaction
async function executeBuy() {
    const amount = parseFloat(buyAmount.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        // Show loading state
        confirmBuy.textContent = 'Processing...';
        confirmBuy.disabled = true;
        confirmBuy.classList.add('loading');
        
        // Use real contract buy function
        const result = await window.buyXau(amount);
        
        if (result.success) {
            // Refresh balance after successful buy
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const xauBalance = await window.getXauBalance(accounts[0]);
            const xauPrice = await window.getXauPrice();
            
            window.balance = xauBalance * xauPrice;
            window.updateUI();
            
            // Add to transaction history
            window.transactions.unshift({
                type: 'buy',
                amount: amount.toFixed(2),
                asset: 'XAU',
                value: amount,
                date: new Date().toLocaleString(),
                hash: result.transactionHash
            });
            
            alert(`Successfully bought $${amount.toFixed(2)} worth of XAU`);
        } else {
            alert(`Buy failed: ${result.error}`);
        }
        
    } catch (error) {
        alert('Transaction failed: ' + error.message);
    } finally {
        // Reset button
        confirmBuy.textContent = 'Confirm Buy';
        confirmBuy.disabled = false;
        confirmBuy.classList.remove('loading');
        buyModal.style.display = 'none';
        buyAmount.value = '';
    }
}

// Execute sell transaction
async function executeSell() {
    const amount = parseFloat(sellAmount.value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    try {
        // Show loading state
        confirmSell.textContent = 'Processing...';
        confirmSell.disabled = true;
        confirmSell.classList.add('loading');
        
        // Use real contract sell function
        const result = await window.sellXau(amount);
        
        if (result.success) {
            // Refresh balance after successful sell
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const xauBalance = await window.getXauBalance(accounts[0]);
            const xauPrice = await window.getXauPrice();
            
            window.balance = xauBalance * xauPrice;
            window.updateUI();
            
            // Add to transaction history
            window.transactions.unshift({
                type: 'sell',
                amount: amount.toFixed(2),
                asset: 'XAU',
                value: amount,
                date: new Date().toLocaleString(),
                hash: result.transactionHash
            });
            
            alert(`Successfully sold $${amount.toFixed(2)} worth of XAU`);
        } else {
            alert(`Sell failed: ${result.error}`);
        }
        
    } catch (error) {
        alert('Transaction failed: ' + error.message);
    } finally {
        // Reset button
        confirmSell.textContent = 'Confirm Sell';
        confirmSell.disabled = false;
        confirmSell.classList.remove('loading');
        sellModal.style.display = 'none';
        sellAmount.value = '';
    }
}

// Make functions globally available
window.updateUI = updateUI;
window.updateTransactionList = updateTransactionList;