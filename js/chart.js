// Chart initialization and real-time updates
let priceChart;
let priceUpdateInterval;

function initializeChart() {
    console.log('🎯 initializeChart called');
    
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Create initial time labels for the last 15 minutes
    const initialLabels = [];
    const initialData = [];
    const now = new Date();
    
    for (let i = 14; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60000)); // 1 minute intervals
        initialLabels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        initialData.push(1950 + (Math.random() * 10 - 5)); // Random data around $1950
    }
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: initialLabels,
            datasets: [{
                label: 'XAU Price (USD)',
                data: initialData,
                borderColor: '#5d78ff',
                backgroundColor: 'rgba(93, 120, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#5d78ff',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(26, 32, 53, 0.9)',
                    titleColor: '#e0e0e0',
                    bodyColor: '#e0e0e0'
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#e0e0e0',
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#e0e0e0', maxTicksLimit: 8 }
                }
            }
        }
    });
    
    console.log('✅ Chart initialized with sample data');
}

// Update chart with real-time data - DEBUG VERSION
async function updateChartWithLiveData() {
    console.log('🔄 updateChartWithLiveData called');
    
    if (!window.walletConnected) {
        console.log('❌ Wallet not connected, skipping update');
        return;
    }
    
    try {
        console.log('📡 Fetching XAU price...');
        const currentPrice = await window.getXauPrice();
        console.log('💰 Current XAU price:', currentPrice);
        
        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        console.log('⏰ Time label:', timeLabel);
        
        // Add new data point
        priceChart.data.labels.push(timeLabel);
        priceChart.data.datasets[0].data.push(currentPrice);
        
        // Keep only last 15 data points for clean display
        if (priceChart.data.labels.length > 15) {
            priceChart.data.labels.shift();
            priceChart.data.datasets[0].data.shift();
        }
        
        console.log('📊 Chart data updated. Labels:', priceChart.data.labels.length, 'Data points:', priceChart.data.datasets[0].data.length);
        
        // Smooth update
        priceChart.update('none');
        console.log('✅ Chart updated successfully');
        
        // Update current price display
        updatePriceDisplay(currentPrice);
        
    } catch (error) {
        console.error('❌ Error updating chart:', error);
    }
}

// Update the current price display
function updatePriceDisplay(price) {
    const priceElement = document.getElementById('currentPrice');
    if (!priceElement) {
        // Create price display if it doesn't exist
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer && !document.getElementById('currentPrice')) {
            const priceDisplay = document.createElement('div');
            priceDisplay.id = 'currentPrice';
            priceDisplay.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: rgba(26, 32, 53, 0.9);
                padding: 5px 10px;
                border-radius: 5px;
                font-size: 14px;
                color: #e0e0e0;
                border: 1px solid #5d78ff;
            `;
            chartContainer.style.position = 'relative';
            chartContainer.appendChild(priceDisplay);
        }
    }
    
    const priceDisplay = document.getElementById('currentPrice');
    if (priceDisplay) {
        priceDisplay.textContent = `Live: $${price.toFixed(2)}`;
    }
}

// Start real-time price updates - DEBUG VERSION
function startPriceUpdates() {
    console.log('🚀 startPriceUpdates called');
    
    // Clear any existing interval
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    // Update immediately
    updateChartWithLiveData();
    
    // Update every 30 seconds
    priceUpdateInterval = setInterval(() => {
        console.log('⏰ Interval tick - updating chart');
        updateChartWithLiveData();
    }, 30000);
    
    console.log('✅ Price updates started - updating every 30 seconds');
}

// Stop updates when wallet disconnects
function stopPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        priceUpdateInterval = null;
        console.log('Price updates stopped');
    }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeChart);