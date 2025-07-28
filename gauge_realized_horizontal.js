// Configuration object to store gauge settings
var realizedGaugeConfig = {
    baseUrlTemplate: 'http://192.168.70.10:5001/api/vol_realized/{CRYPTO}/{HOURS}',
    selectedCrypto: 'ETH', // Default to ETH
    selectedHours: 24, // Default to 24 hours (1 day)
    selectedMetric: 'volatility', // Default to volatility
    minValue: 0,
    maxValue: 140,
    lastUpdateTime: null,
    intervalId: null, // Store interval ID for cleanup
    isLoading: false, // Track loading state
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAwSbTZye21tiF7FHsG1kUK1Z2EPoHMeSODg&s' // Add your logo path here
};

// Function to get the current API URL based on selected crypto and hours
function getRealizedCurrentUrl() {
    const baseUrl = realizedGaugeConfig.baseUrlTemplate.replace('{CRYPTO}', realizedGaugeConfig.selectedCrypto);
    return baseUrl.replace('{HOURS}', realizedGaugeConfig.selectedHours);
}

// Function to format timestamp for display
function formatRealizedTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Function to get hours display text
function getHoursDisplayText(hoursValue) {
    const hours = {
        1: '1 Hour',
        24: '1 Day',
        168: '7 Days', // 7*24
        720: '30 Days'  // 30*24
    };
    return hours[hoursValue] || `${hoursValue} Hours`;
}

// Function to get metric display text
function getMetricDisplayText(metricValue) {
    const metrics = {
        'volatility': 'Volatility',
        'upside_volatility': 'Upside Volatility',
        'downside_volatility': 'Downside Volatility'
    };
    return metrics[metricValue] || metricValue;
}

// Function to calculate 5 equal color zones based on min/max values
function calculateRealizedColorZones(minVal, maxVal) {
    const range = maxVal - minVal;
    const zoneSize = range / 5;
    
    return [
        { from: minVal, to: minVal + zoneSize, color: "rgba(50, 200, 50, .75)" },           // Green - Level 1
        { from: minVal + zoneSize, to: minVal + (zoneSize * 2), color: "rgba(120, 220, 120, .75)" },   // Light Green - Level 2
        { from: minVal + (zoneSize * 2), to: minVal + (zoneSize * 3), color: "rgba(240, 210, 40, .75)" },    // Yellow - Level 3
        { from: minVal + (zoneSize * 3), to: minVal + (zoneSize * 4), color: "rgba(255, 165, 0, .75)" },     // Orange - Level 4
        { from: minVal + (zoneSize * 4), to: maxVal, color: "rgba(200, 50, 50, .75)" }      // Red - Level 5
    ];
}

// Function to get a descriptive sentence for the volatility level
function getRealizedVolatilityDescription(volatility, minVal, maxVal) {
    const range = maxVal - minVal;
    const zoneSize = range / 5;

    if (volatility <= minVal + zoneSize) {
        return "Volatility is Very Low";
    } else if (volatility <= minVal + (zoneSize * 2)) {
        return "Volatility is Low";
    } else if (volatility <= minVal + (zoneSize * 3)) {
        return "Volatility is Moderate";
    } else if (volatility <= minVal + (zoneSize * 4)) {
        return "Volatility is High";
    } else {
        return "Volatility is Very High";
    }
}

// Function to generate major ticks based on min/max values
function generateRealizedMajorTicks(minVal, maxVal, numTicks = 11) {
    const range = maxVal - minVal;
    const step = range / (numTicks - 1);
    const ticks = [];
    
    for (let i = 0; i < numTicks; i++) {
        const value = minVal + (step * i);
        ticks.push(Math.round(value * 10) / 10); // Round to 1 decimal place
    }
    
    return ticks.map(String);
}

// Function to show loading state on the gauge
function showRealizedLoadingState() {
    realizedGaugeConfig.isLoading = true;
    realizedGauge.value = (realizedGaugeConfig.minValue + realizedGaugeConfig.maxValue) / 2; // Center needle
    realizedGauge.draw();
    
    // Update displays
    updateRealizedTimestampDisplay(null);
    updateRealizedVolatilityDescription("Loading data...");
    updateRealizedVolatilityValue(null); // Update volatility value display
    updateRealizedPeriodDisplay(); // Update period display
    
    console.log('Realized: Loading state displayed');
}

// Function to hide loading state
function hideRealizedLoadingState() {
    realizedGaugeConfig.isLoading = false;
    console.log('Realized: Loading state hidden');
}

// Initialize gauge with default values
var realizedGauge = new RadialGauge({
    // === BASIC CONFIGURATION ===
    renderTo: 'canvas-id_realized_horizontal',
    width: 300,
    height: 300,
    title: realizedGaugeConfig.selectedCrypto,
    
    // === VALUE & RANGE ===
    value: 0, // Still needed to position the needle
    minValue: realizedGaugeConfig.minValue,
    maxValue: realizedGaugeConfig.maxValue,
    
    // === GAUGE GEOMETRY ===
    startAngle: 50,
    ticksAngle: 260,
    borders: false,
    borderShadowWidth: 0,
    
    // === TICKS & LABELS ===
    majorTicks: generateRealizedMajorTicks(realizedGaugeConfig.minValue, realizedGaugeConfig.maxValue),
    minorTicks: 2,
    strokeTicks: true,
    
    // === COLORS ===
    colorPlate: "#fff",
    
    // === HIGHLIGHTS (COLOR ZONES) ===
    highlights: calculateRealizedColorZones(realizedGaugeConfig.minValue, realizedGaugeConfig.maxValue),
    
    // === NEEDLE CONFIGURATION ===
    needleType: "arrow",
    needleWidth: 2,
    needleCircleSize: 7,
    needleCircleOuter: true,
    needleCircleInner: false,
    
    // === VALUE BOX ===
    valueBox: false,
    valueBoxStroke: 0,
    valueBoxWidth: 0,
    colorValueBoxRect: "transparent",
    colorValueBoxRectEnd: "transparent",
    colorValueBoxBackground: "transparent",

    // === FONTS - TITLE ===
    fontTitle: "Arial",
    fontTitleSize: 40,
    fontTitleWeight: "bold",
    colorTitle: "#333",
    
    // === FONTS - VALUE ===
    fontValue: "Arial",
    fontValueSize: 30 ,
    fontValueWeight: "bold",
    fontValueColor: "#333",
    
    // === ANIMATION ===
    animationDuration: 1000,
    animationRule: "linear"
}).draw();

// Function to create the main horizontal container (5 COLUMNS: logo, controls, gauge, volatility value, status displays)
function createRealizedMainContainer() {
    const canvas = document.getElementById('canvas-id_realized_horizontal');
    const originalContainer = canvas.parentElement;

    let mainContainer = document.getElementById('realized-main-horizontal-container');
    
    if (!mainContainer) {
        // Create the main card container
        const cardContainer = document.createElement('div');
        cardContainer.id = 'realized-dashboard-card';
        cardContainer.style.cssText = `
            background: rgba(255, 255, 255, 0.95);
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07);
            padding: 10px;
            margin: 10px auto;
            max-width: 1600px;
            width: 70%;
            border: 10px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        `;

        mainContainer = document.createElement('div');
        mainContainer.id = 'realized-main-horizontal-container';
        mainContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 0px;
            width: 100%;
        `;
        
        // Create five columns with uniform background
        const logoColumn = document.createElement('div');
        logoColumn.id = 'realized-logo-column';
        logoColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            min-width: 160px;
            width: 160px;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        
        const leftColumn = document.createElement('div');
        leftColumn.id = 'realized-left-column';
        leftColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            min-width: 220px;
            width: 220px;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        
        const centerColumn = document.createElement('div');
        centerColumn.id = 'realized-center-column';
        centerColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
            min-height: 300px;
            margin-top: 0px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        
        const rightColumn = document.createElement('div');
        rightColumn.id = 'realized-right-column';
        rightColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            min-width: 220px;
            width: 220px;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        
        const statusColumn = document.createElement('div');
        statusColumn.id = 'realized-status-column';
        statusColumn.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            min-width: 200px;
            width: 200px;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        `;
        
        mainContainer.appendChild(logoColumn);
        mainContainer.appendChild(leftColumn);
        mainContainer.appendChild(centerColumn);
        mainContainer.appendChild(rightColumn);
        mainContainer.appendChild(statusColumn);
        
        // Add the main container to the card
        cardContainer.appendChild(mainContainer);
        
        // Insert the card container before the canvas's parent
        originalContainer.insertBefore(cardContainer, canvas);
        
        // Move canvas to center column
        centerColumn.appendChild(canvas);
    }
    
    return mainContainer;
}

// Function to add logo to the dedicated logo column
function addRealizedLogoDisplay() {
    createRealizedMainContainer();
    const logoColumn = document.getElementById('realized-logo-column');
    
    let logoElement = document.getElementById('realized-company-logo');
    if (!logoElement && realizedGaugeConfig.logoUrl) {
        // Create container for logo
        const logoContainer = document.createElement('div');
        logoContainer.id = 'realized-logo-container';
        logoContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create logo image
        logoElement = document.createElement('img');
        logoElement.id = 'realized-company-logo';
        logoElement.src = realizedGaugeConfig.logoUrl;
        logoElement.alt = 'Company Logo';
        logoElement.style.cssText = `
            max-width: 140px;
            max-height: 140px;
            width: auto;
            height: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        `;

        // Add hover effect
        logoElement.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });

        logoElement.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });

        // Handle image load errors
        logoElement.addEventListener('error', function() {
            console.log('Realized: Logo image failed to load, creating placeholder');
            createRealizedLogoPlaceholder(logoContainer);
        });

        logoContainer.appendChild(logoElement);
        logoColumn.appendChild(logoContainer);
    }
    
    return logoElement;
}

// Function to create a placeholder if logo doesn't load
function createRealizedLogoPlaceholder(container) {
    // Remove the failed img element
    const failedImg = container.querySelector('img');
    if (failedImg) {
        failedImg.remove();
    }

    // Create a styled placeholder
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
        width: 100px;
        height: 100px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border: 2px solid #fff;
        margin: 0 auto;
    `;
    placeholder.textContent = 'LOGO';
    
    container.appendChild(placeholder);
}

// Function to update logo URL dynamically
function updateRealizedLogo(newLogoUrl) {
    realizedGaugeConfig.logoUrl = newLogoUrl;
    const logoElement = document.getElementById('realized-company-logo');
    if (logoElement) {
        logoElement.src = newLogoUrl;
    } else {
        // Create logo if it doesn't exist
        addRealizedLogoDisplay();
    }
}

// Function to create and add the cryptocurrency selection dropdown
function addRealizedCryptoSelector() {
    createRealizedMainContainer();
    const leftColumn = document.getElementById('realized-left-column');
    
    let selectorElement = document.getElementById('realized-crypto-selector');
    if (!selectorElement) {
        // Create the container for the crypto selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'realized-crypto-selector-container';
        selectorContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create the title
        const title = document.createElement('h3');
        title.textContent = 'Cryptocurrency';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        // Create the select dropdown
        selectorElement = document.createElement('select');
        selectorElement.id = 'realized-crypto-selector';
        selectorElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: white;
            color: #333;
            cursor: pointer;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        `;

        // Add options
        const cryptos = [
            { value: 'BTC', text: 'Bitcoin (BTC)' },
            { value: 'ETH', text: 'Ethereum (ETH)' }
        ];

        cryptos.forEach(crypto => {
            const option = document.createElement('option');
            option.value = crypto.value;
            option.textContent = crypto.text;
            if (crypto.value === realizedGaugeConfig.selectedCrypto) {
                option.selected = true;
            }
            selectorElement.appendChild(option);
        });

        // Add event listener for changes
        selectorElement.addEventListener('change', function() {
            const newCrypto = this.value;
            realizedGaugeConfig.selectedCrypto = newCrypto;
            
            // Force title update by recreating the gauge configuration
            realizedGauge.options.title = newCrypto;
            
            // Method 1: Try update() first
            try {
                realizedGauge.update({
                    title: newCrypto
                });
            } catch (e) {
                // Method 2: If update() fails, force redraw
                console.log('Realized: Update failed, forcing redraw');
                realizedGauge.draw();
            }
            
            // Method 3: If both above fail, you can force it by accessing the internal canvas
            // This is a more aggressive approach
            setTimeout(() => {
                if (realizedGauge.options.title !== newCrypto) {
                    console.log('Realized: Forcing title update via complete redraw');
                    realizedGauge.options.title = newCrypto;
                    realizedGauge.draw();
                }
            }, 100);
            
            console.log(`Realized: Cryptocurrency changed to: ${newCrypto}`);
            console.log(`Realized: Gauge title should now be: ${realizedGauge.options.title}`);
            
            // Show loading state immediately
            showRealizedLoadingState();
            
            // Stop current updates and fetch data with new crypto
            stopRealizedDataUpdates();
            fetchRealizedVolatilityData().then(() => {
                if (realizedGaugeConfig.intervalId) {
                    clearInterval(realizedGaugeConfig.intervalId);
                }
                realizedGaugeConfig.intervalId = setInterval(fetchRealizedVolatilityData, 10000);
            });
        });

        // Assemble the selector
        selectorContainer.appendChild(title);
        selectorContainer.appendChild(selectorElement);
        leftColumn.appendChild(selectorContainer);
    }
    
    return selectorElement;
}

// Function to create and add the hours selection dropdown
function addRealizedHoursSelector() {
    createRealizedMainContainer();
    const leftColumn = document.getElementById('realized-left-column');
    
    let selectorElement = document.getElementById('realized-hours-selector');
    if (!selectorElement) {
        // Create the container for the selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'realized-hours-selector-container';
        selectorContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create the title
        const title = document.createElement('h3');
        title.textContent = 'Time Window';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        // Create the select dropdown
        selectorElement = document.createElement('select');
        selectorElement.id = 'realized-hours-selector';
        selectorElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: white;
            color: #333;
            cursor: pointer;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        `;

        // Add options
        const hours = [
            { value: 1, text: '1 Hour' },
            { value: 24, text: '1 Day' },
            { value: 168, text: '7 Days' }, // 7*24
            { value: 720, text: '30 Days' }  // 30*24
        ];

        hours.forEach(hour => {
            const option = document.createElement('option');
            option.value = hour.value;
            option.textContent = hour.text;
            if (hour.value === realizedGaugeConfig.selectedHours) {
                option.selected = true;
            }
            selectorElement.appendChild(option);
        });

        // Add event listener for changes
        selectorElement.addEventListener('change', function() {
            const newHours = parseInt(this.value);
            realizedGaugeConfig.selectedHours = newHours;
            console.log(`Realized: Hours changed to: ${newHours} hours`);
            console.log(`Realized: New URL: ${getRealizedCurrentUrl()}`);
            
            // Update the period display
            updateRealizedPeriodDisplay();
            
            // Show loading state immediately
            showRealizedLoadingState();
            
            // Stop current updates and fetch data with new hours
            stopRealizedDataUpdates();
            fetchRealizedVolatilityData().then(() => {
                // Restart periodic updates after successful fetch
                if (realizedGaugeConfig.intervalId) {
                    clearInterval(realizedGaugeConfig.intervalId);
                }
                realizedGaugeConfig.intervalId = setInterval(fetchRealizedVolatilityData, 10000);
            });
        });

        // Assemble the selector
        selectorContainer.appendChild(title);
        selectorContainer.appendChild(selectorElement);
        leftColumn.appendChild(selectorContainer);
    }
    
    return selectorElement;
}

// Function to create and add the metric selection dropdown
function addRealizedMetricSelector() {
    createRealizedMainContainer();
    const leftColumn = document.getElementById('realized-left-column');
    
    let selectorElement = document.getElementById('realized-metric-selector');
    if (!selectorElement) {
        // Create the container for the selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'realized-metric-selector-container';
        selectorContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create the title
        const title = document.createElement('h3');
        title.textContent = 'Metric Type';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        // Create the select dropdown
        selectorElement = document.createElement('select');
        selectorElement.id = 'realized-metric-selector';
        selectorElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            padding: 8px 12px;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: white;
            color: #333;
            cursor: pointer;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        `;

        // Add options
        const metrics = [
            { value: 'volatility', text: 'Volatility' },
            { value: 'upside_volatility', text: 'Upside Volatility' },
            { value: 'downside_volatility', text: 'Downside Volatility' }
        ];

        metrics.forEach(metric => {
            const option = document.createElement('option');
            option.value = metric.value;
            option.textContent = metric.text;
            if (metric.value === realizedGaugeConfig.selectedMetric) {
                option.selected = true;
            }
            selectorElement.appendChild(option);
        });

        // Add event listener for changes
        selectorElement.addEventListener('change', function() {
            const newMetric = this.value;
            realizedGaugeConfig.selectedMetric = newMetric;
            console.log(`Realized: Metric changed to: ${newMetric}`);
            
            // Update the metric display
            updateRealizedMetricDisplay();
            
            // Show loading state immediately
            showRealizedLoadingState();
            
            // Stop current updates and fetch data with new metric
            stopRealizedDataUpdates();
            fetchRealizedVolatilityData().then(() => {
                // Restart periodic updates after successful fetch
                if (realizedGaugeConfig.intervalId) {
                    clearInterval(realizedGaugeConfig.intervalId);
                }
                realizedGaugeConfig.intervalId = setInterval(fetchRealizedVolatilityData, 10000);
            });
        });

        // Assemble the selector
        selectorContainer.appendChild(title);
        selectorContainer.appendChild(selectorElement);
        leftColumn.appendChild(selectorContainer);
    }
    
    return selectorElement;
}

// Function to add metric display (first in right column)
function addRealizedMetricDisplay() {
    createRealizedMainContainer();
    const rightColumn = document.getElementById('realized-right-column');
    
    let metricElement = document.getElementById('realized-metric-display');
    if (!metricElement) {
        // Create container for metric
        const metricContainer = document.createElement('div');
        metricContainer.id = 'realized-metric-container';
        metricContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 20px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = "Selected Metric";
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        metricElement = document.createElement('div');
        metricElement.id = 'realized-metric-display';
        metricElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #2c5aa0;
            font-weight: bold;
            text-align: center;
            background-color: transparent;
            border: 2px solid rgba(209, 220, 229, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 5px;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        metricContainer.appendChild(title);
        metricContainer.appendChild(metricElement);
        
        // Insert at the beginning of the right column
        const firstChild = rightColumn.firstChild;
        if (firstChild) {
            rightColumn.insertBefore(metricContainer, firstChild);
        } else {
            rightColumn.appendChild(metricContainer);
        }
    }
    
    return metricElement;
}

// Function to add volatility value display
function addRealizedVolatilityValueDisplay() {
    createRealizedMainContainer();
    const rightColumn = document.getElementById('realized-right-column');
    
    let volatilityValueElement = document.getElementById('realized-volatility-value-display');
    if (!volatilityValueElement) {
        // Create container for volatility value
        const volatilityValueContainer = document.createElement('div');
        volatilityValueContainer.id = 'realized-volatility-value-container';
        volatilityValueContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 2px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = "Realized Volatility";
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        volatilityValueElement = document.createElement('div');
        volatilityValueElement.id = 'realized-volatility-value-display';
        volatilityValueElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 30px;
            color: #2c5aa0;
            font-weight: bold;
            text-align: center;
            background-color: transparent;
            border: 2px solid rgba(225, 232, 237, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 5px;
            min-height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        volatilityValueContainer.appendChild(title);
        volatilityValueContainer.appendChild(volatilityValueElement);
        
        // Add after the metric display
        rightColumn.appendChild(volatilityValueContainer);
    }
    
    return volatilityValueElement;
}

// Function to add period display
function addRealizedPeriodDisplay() {
    createRealizedMainContainer();
    const rightColumn = document.getElementById('realized-right-column');
    
    let periodElement = document.getElementById('realized-period-display');
    if (!periodElement) {
        // Create container for period
        const periodContainer = document.createElement('div');
        periodContainer.id = 'realized-period-container';
        periodContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = "Selected Period";
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        periodElement = document.createElement('div');
        periodElement.id = 'realized-period-display';
        periodElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #2c5aa0;
            font-weight: bold;
            text-align: center;
            background-color: transparent;
            border: 2px solid rgba(209, 220, 229, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 5px;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        periodContainer.appendChild(title);
        periodContainer.appendChild(periodElement);
        
        // Add the period container to the right column
        rightColumn.appendChild(periodContainer);
    }
    
    return periodElement;
}

// Function to add metric display (moved earlier in function order)
function addRealizedMetricDisplay() {
    createRealizedMainContainer();
    const rightColumn = document.getElementById('realized-right-column');
    
    let metricElement = document.getElementById('realized-metric-display');
    if (!metricElement) {
        // Create container for metric
        const metricContainer = document.createElement('div');
        metricContainer.id = 'realized-metric-container';
        metricContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = "Selected Metric";
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        metricElement = document.createElement('div');
        metricElement.id = 'realized-metric-display';
        metricElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 16px;
            color: #2c5aa0;
            font-weight: bold;
            text-align: center;
            background-color: transparent;
            border: 2px solid rgba(209, 220, 229, 0.3);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 5px;
            min-height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        metricContainer.appendChild(title);
        metricContainer.appendChild(metricElement);
        
        // Add the metric container to the right column
        rightColumn.appendChild(metricContainer);
    }
    
    return metricElement;
}

// Function to update volatility value display
function updateRealizedVolatilityValue(volatility) {
    const volatilityValueElement = addRealizedVolatilityValueDisplay();
    if (volatilityValueElement && volatility !== null && volatility !== undefined) {
        volatilityValueElement.textContent = `${volatility.toFixed(2)}%`;
        volatilityValueElement.style.color = '#2c5aa0';
    } else if (volatilityValueElement) {
        if (realizedGaugeConfig.isLoading) {
            volatilityValueElement.textContent = 'Loading...';
            volatilityValueElement.style.color = '#666';
        } else {
            volatilityValueElement.textContent = 'No data';
            volatilityValueElement.style.color = '#999';
        }
    }
}

// Function to update period display
function updateRealizedPeriodDisplay() {
    const periodElement = addRealizedPeriodDisplay();
    if (periodElement) {
        const periodText = getHoursDisplayText(realizedGaugeConfig.selectedHours);
        periodElement.textContent = periodText;
        periodElement.style.color = '#2c5aa0';
    }
}

// Function to update metric display
function updateRealizedMetricDisplay() {
    const metricElement = addRealizedMetricDisplay();
    if (metricElement) {
        const metricText = getMetricDisplayText(realizedGaugeConfig.selectedMetric);
        metricElement.textContent = metricText;
        metricElement.style.color = '#2c5aa0';
    }
}

// Function to add custom timestamp display after gauge initialization
function addRealizedTimestampDisplay() {
    createRealizedMainContainer();
    const statusColumn = document.getElementById('realized-status-column');
    
    let timestampElement = document.getElementById('realized-timestamp-display');
    if (!timestampElement) {
        // Create container for timestamp
        const timestampContainer = document.createElement('div');
        timestampContainer.id = 'realized-timestamp-container';
        timestampContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Last Update';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        timestampElement = document.createElement('div');
        timestampElement.id = 'realized-timestamp-display';
        timestampElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #666;
            text-align: center;
            background-color: transparent;
            border: 1px solid rgba(200, 200, 200, 0.2);
            border-radius: 6px;
            padding: 8px;
        `;

        timestampContainer.appendChild(title);
        timestampContainer.appendChild(timestampElement);
        statusColumn.appendChild(timestampContainer);
    }
    
    return timestampElement;
}

// Function to add the description display element
function addRealizedDescriptionDisplay() {
    createRealizedMainContainer();
    const statusColumn = document.getElementById('realized-status-column');

    let descriptionElement = document.getElementById('realized-volatility-description');
    if (!descriptionElement) {
        // Create container for description
        const descriptionContainer = document.createElement('div');
        descriptionContainer.id = 'realized-description-container';
        descriptionContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Volatility Level';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        descriptionElement = document.createElement('div');
        descriptionElement.id = 'realized-volatility-description';
        descriptionElement.style.cssText = `
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #444;
            font-weight: bold;
            text-align: center;
            background-color: transparent;
            border: 1px solid rgba(200, 200, 200, 0.2);
            border-radius: 6px;
            padding: 8px;
        `;

        descriptionContainer.appendChild(title);
        descriptionContainer.appendChild(descriptionElement);
        statusColumn.appendChild(descriptionContainer);
    }
    return descriptionElement;
}

// Function to update timestamp display
function updateRealizedTimestampDisplay(timestamp) {
    const timestampElement = addRealizedTimestampDisplay();
    if (timestampElement && timestamp) {
        const formattedTime = formatRealizedTimestamp(timestamp);
        timestampElement.textContent = formattedTime;
        realizedGaugeConfig.lastUpdateTime = timestamp;
    } else if (timestampElement) {
        if (realizedGaugeConfig.isLoading) {
            timestampElement.textContent = 'Loading...';
        } else {
            timestampElement.textContent = 'No data';
        }
    }
}

// Function to update the volatility description text
function updateRealizedVolatilityDescription(description) {
    const descriptionElement = addRealizedDescriptionDisplay();
    if (descriptionElement) {
        descriptionElement.textContent = description || 'Awaiting data';
    }
}

// Function to update gauge range and recalculate zones
function updateRealizedGaugeRange(minVal, maxVal) {
    realizedGaugeConfig.minValue = minVal;
    realizedGaugeConfig.maxValue = maxVal;
    
    realizedGauge.options.minValue = minVal;
    realizedGauge.options.maxValue = maxVal;
    realizedGauge.options.majorTicks = generateRealizedMajorTicks(minVal, maxVal);
    realizedGauge.options.highlights = calculateRealizedColorZones(minVal, maxVal);
    
    realizedGauge.draw();
    
    console.log(`Realized: Updated gauge range: ${minVal} - ${maxVal}`);
    console.log('Realized: New color zones:', calculateRealizedColorZones(minVal, maxVal));
}

// Function to fetch data from API
async function fetchRealizedVolatilityData() {
    try {
        const currentUrl = getRealizedCurrentUrl();
        console.log(`Realized: Fetching data from: ${currentUrl}`);
        
        const response = await fetch(currentUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loading state once data is received
        hideRealizedLoadingState();
        
        const volatility = data.metrics[realizedGaugeConfig.selectedMetric];
        const timestamp = data.timestamp;
        const windowHours = data.window_hours;
        
        const currentMin = realizedGaugeConfig.minValue;
        const currentMax = realizedGaugeConfig.maxValue;
        
        let newMin = currentMin;
        let newMax = currentMax;
        let rangeUpdated = false;
        
        if (volatility < currentMin) {
            newMin = Math.floor(volatility * 0.8);
            rangeUpdated = true;
        }
        
        if (volatility > currentMax) {
            newMax = Math.ceil(volatility * 1.2);
            rangeUpdated = true;
        }
        
        if (rangeUpdated) {
            updateRealizedGaugeRange(newMin, newMax);
        }

        // Update gauge needle position only (no text display on gauge)
        realizedGauge.value = volatility;
        
        // Update all displays
        updateRealizedVolatilityValue(volatility);
        updateRealizedPeriodDisplay();
        updateRealizedMetricDisplay();
        updateRealizedTimestampDisplay(timestamp);
        const description = getRealizedVolatilityDescription(volatility, newMin, newMax);
        updateRealizedVolatilityDescription(description);
        
        console.log(`Realized: Updated ${realizedGaugeConfig.selectedMetric}: ${volatility}% (${realizedGaugeConfig.selectedCrypto}, ${realizedGaugeConfig.selectedHours} hours)`);
        console.log(`Realized: Current range: ${newMin} - ${newMax}`);
        console.log(`Realized: Last update: ${formatRealizedTimestamp(timestamp)}`);
        
        return data;
    } catch (error) {
        console.error('Realized: Error fetching volatility data:', error);
        
        // Hide loading state on error
        hideRealizedLoadingState();
        
        const fallbackValue = 0;
        realizedGauge.value = fallbackValue;
        
        // Update displays on error
        updateRealizedVolatilityValue(null);
        updateRealizedPeriodDisplay();
        updateRealizedMetricDisplay();
        updateRealizedTimestampDisplay(null);
        updateRealizedVolatilityDescription("Data unavailable");
    }
}

// Function to start/restart data updates
function startRealizedDataUpdates() {
    // Clear existing interval if any
    if (realizedGaugeConfig.intervalId) {
        clearInterval(realizedGaugeConfig.intervalId);
    }
    
    // Fetch data immediately
    fetchRealizedVolatilityData();
    
    // Set up new interval
    realizedGaugeConfig.intervalId = setInterval(fetchRealizedVolatilityData, 10000);
}

// Function to stop data updates (useful for cleanup)
function stopRealizedDataUpdates() {
    if (realizedGaugeConfig.intervalId) {
        clearInterval(realizedGaugeConfig.intervalId);
        realizedGaugeConfig.intervalId = null;
    }
}

// Start the data updates when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the crypto selector first
    addRealizedCryptoSelector();
    
    // Initialize the hours selector
    addRealizedHoursSelector();
    
    // Initialize the metric selector
    addRealizedMetricSelector();
    
    // Initialize display elements with placeholder text - METRIC FIRST
    updateRealizedMetricDisplay();
    updateRealizedVolatilityValue(null);
    updateRealizedPeriodDisplay();
    updateRealizedTimestampDisplay(null);
    updateRealizedVolatilityDescription("Awaiting data");
    
    // Initialize logo display
    addRealizedLogoDisplay();
    
    // Start data updates
    startRealizedDataUpdates();
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopRealizedDataUpdates();
});