// Configuration object to store gauge settings
var gaugeConfig = {
    baseUrlTemplate: 'http://192.168.70.10:5001/api/vol_forecast/{CRYPTO}/',
    selectedCrypto: 'ETH', // Default to ETH
    selectedPeriod: 30, // Default to 30 days
    minValue: 0,
    maxValue: 140,
    lastUpdateTime: null,
    intervalId: null, // Store interval ID for cleanup
    isLoading: false, // Track loading state
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAwSbTZye21tiF7FHsG1kUK1Z2EPoHMeSODg&s' // Add your logo path here
};

// Function to get the current API URL based on selected period
function getCurrentUrl() {
    const baseUrl = gaugeConfig.baseUrlTemplate.replace('{CRYPTO}', gaugeConfig.selectedCrypto);
    return baseUrl + gaugeConfig.selectedPeriod;
}

// Function to format timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
}

// Function to get period display text
function getPeriodDisplayText(periodValue) {
    const periods = {
        0: '1 Hour',
        1: '1 Day',
        7: '7 Days',
        30: '30 Days'
    };
    return periods[periodValue] || `${periodValue} Days`;
}

// Function to calculate 5 equal color zones based on min/max values
function calculateColorZones(minVal, maxVal) {
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
function getVolatilityDescription(volatility, minVal, maxVal) {
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
function generateMajorTicks(minVal, maxVal, numTicks = 11) {
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
function showLoadingState() {
    gaugeConfig.isLoading = true;
    gauge.value = (gaugeConfig.minValue + gaugeConfig.maxValue) / 2; // Center needle
    gauge.draw();
    
    // Update displays
    updateTimestampDisplay(null);
    updateVolatilityDescription("Loading data...");
    updateVolatilityValue(null); // Update volatility value display
    updateForecastPeriodDisplay(); // Update forecast period display
    
    console.log('Loading state displayed');
}

// Function to hide loading state
function hideLoadingState() {
    gaugeConfig.isLoading = false;
    console.log('Loading state hidden');
}

// Initialize gauge with default values
var gauge = new RadialGauge({
    // === BASIC CONFIGURATION ===
    renderTo: 'canvas-id_forecast_horizontal',
    width: 300,
    height: 300,
    title: gaugeConfig.selectedCrypto,
    
    // === VALUE & RANGE ===
    value: 0, // Still needed to position the needle
    minValue: gaugeConfig.minValue,
    maxValue: gaugeConfig.maxValue,
    
    // === GAUGE GEOMETRY ===
    startAngle: 50,
    ticksAngle: 260,
    borders: false,
    borderShadowWidth: 0,
    
    // === TICKS & LABELS ===
    majorTicks: generateMajorTicks(gaugeConfig.minValue, gaugeConfig.maxValue),
    minorTicks: 2,
    strokeTicks: true,
    
    // === COLORS ===
    colorPlate: "#fff",
    
    // === HIGHLIGHTS (COLOR ZONES) ===
    highlights: calculateColorZones(gaugeConfig.minValue, gaugeConfig.maxValue),
    
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

    // === REMOVED: Custom Value Display ===
    // valueText: "Awaiting data", // Removed - no text display on gauge

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
function createMainContainer() {
    const canvas = document.getElementById('canvas-id_forecast_horizontal');
    const originalContainer = canvas.parentElement;

    let mainContainer = document.getElementById('main-horizontal-container');
    
    if (!mainContainer) {
        // Create the main card container
        const cardContainer = document.createElement('div');
        cardContainer.id = 'dashboard-card';
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
        mainContainer.id = 'main-horizontal-container';
        mainContainer.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: flex-start;
            gap: 0px;
            width: 100%;
        `;
        
        // Create five columns with uniform background
        const logoColumn = document.createElement('div');
        logoColumn.id = 'logo-column';
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
        leftColumn.id = 'left-column';
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
        centerColumn.id = 'center-column';
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
        rightColumn.id = 'right-column';
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
        statusColumn.id = 'status-column';
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
function addLogoDisplay() {
    createMainContainer();
    const logoColumn = document.getElementById('logo-column');
    
    let logoElement = document.getElementById('company-logo');
    if (!logoElement && gaugeConfig.logoUrl) {
        // Create container for logo
        const logoContainer = document.createElement('div');
        logoContainer.id = 'logo-container';
        logoContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create logo image
        logoElement = document.createElement('img');
        logoElement.id = 'company-logo';
        logoElement.src = gaugeConfig.logoUrl;
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
            console.log('Logo image failed to load, creating placeholder');
            createLogoPlaceholder(logoContainer);
        });

        logoContainer.appendChild(logoElement);
        logoColumn.appendChild(logoContainer);
    }
    
    return logoElement;
}

// Function to create a placeholder if logo doesn't load
function createLogoPlaceholder(container) {
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

// NEW: Function to update logo URL dynamically
function updateLogo(newLogoUrl) {
    gaugeConfig.logoUrl = newLogoUrl;
    const logoElement = document.getElementById('company-logo');
    if (logoElement) {
        logoElement.src = newLogoUrl;
    } else {
        // Create logo if it doesn't exist
        addLogoDisplay();
    }
}

// Function to create and add the cryptocurrency selection dropdown
function addCryptoSelector() {
    createMainContainer();
    const leftColumn = document.getElementById('left-column');
    
    let selectorElement = document.getElementById('crypto-selector');
    if (!selectorElement) {
        // Create the container for the crypto selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'crypto-selector-container';
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
        selectorElement.id = 'crypto-selector';
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
            if (crypto.value === gaugeConfig.selectedCrypto) {
                option.selected = true;
            }
            selectorElement.appendChild(option);
        });

        // Add event listener for changes
        selectorElement.addEventListener('change', function() {
            const newCrypto = this.value;
            gaugeConfig.selectedCrypto = newCrypto;
            
            // Force title update by recreating the gauge configuration
            gauge.options.title = newCrypto;
            
            // Method 1: Try update() first
            try {
                gauge.update({
                    title: newCrypto
                });
            } catch (e) {
                // Method 2: If update() fails, force redraw
                console.log('Update failed, forcing redraw');
                gauge.draw();
            }
            
            // Method 3: If both above fail, you can force it by accessing the internal canvas
            // This is a more aggressive approach
            setTimeout(() => {
                if (gauge.options.title !== newCrypto) {
                    console.log('Forcing title update via complete redraw');
                    gauge.options.title = newCrypto;
                    gauge.draw();
                }
            }, 100);
            
            console.log(`Cryptocurrency changed to: ${newCrypto}`);
            console.log(`Gauge title should now be: ${gauge.options.title}`);
            
            // Show loading state immediately
            showLoadingState();
            
            // Stop current updates and fetch data with new crypto
            stopDataUpdates();
            fetchVolatilityData().then(() => {
                if (gaugeConfig.intervalId) {
                    clearInterval(gaugeConfig.intervalId);
                }
                gaugeConfig.intervalId = setInterval(fetchVolatilityData, 10000);
            });
        });

        // Assemble the selector
        selectorContainer.appendChild(title);
        selectorContainer.appendChild(selectorElement);
        leftColumn.appendChild(selectorContainer);
    }
    
    return selectorElement;
}

// Function to create and add the time period selection dropdown
function addPeriodSelector() {
    createMainContainer();
    const leftColumn = document.getElementById('left-column');
    
    let selectorElement = document.getElementById('period-selector');
    if (!selectorElement) {
        // Create the container for the selector
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'period-selector-container';
        selectorContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
            width: 100%;
        `;

        // Create the title
        const title = document.createElement('h3');
        title.textContent = 'Forecast Period';
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        // Create the select dropdown
        selectorElement = document.createElement('select');
        selectorElement.id = 'period-selector';
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
        const periods = [
            { value: 0, text: '1 Hour' },
            { value: 1, text: '1 Day' },
            { value: 7, text: '7 Days' },
            { value: 30, text: '30 Days' }
        ];

        periods.forEach(period => {
            const option = document.createElement('option');
            option.value = period.value;
            option.textContent = period.text;
            if (period.value === gaugeConfig.selectedPeriod) {
                option.selected = true;
            }
            selectorElement.appendChild(option);
        });

        // Add event listener for changes
        selectorElement.addEventListener('change', function() {
            const newPeriod = parseInt(this.value);
            gaugeConfig.selectedPeriod = newPeriod;
            console.log(`Period changed to: ${newPeriod} days`);
            console.log(`New URL: ${getCurrentUrl()}`);
            
            // Update the forecast period display
            updateForecastPeriodDisplay();
            
            // Show loading state immediately
            showLoadingState();
            
            // Stop current updates and fetch data with new period
            stopDataUpdates();
            fetchVolatilityData().then(() => {
                // Restart periodic updates after successful fetch
                if (gaugeConfig.intervalId) {
                    clearInterval(gaugeConfig.intervalId);
                }
                gaugeConfig.intervalId = setInterval(fetchVolatilityData, 10000);
            });
        });

        // Assemble the selector
        selectorContainer.appendChild(title);
        selectorContainer.appendChild(selectorElement);
        leftColumn.appendChild(selectorContainer);
    }
    
    return selectorElement;
}

// Function to add volatility value display
function addVolatilityValueDisplay() {
    createMainContainer();
    const rightColumn = document.getElementById('right-column');
    
    let volatilityValueElement = document.getElementById('volatility-value-display');
    if (!volatilityValueElement) {
        // Create container for volatility value
        const volatilityValueContainer = document.createElement('div');
        volatilityValueContainer.id = 'volatility-value-container';
        volatilityValueContainer.style.cssText = `
            text-align: center;
            font-family: Arial, sans-serif;
            padding: 10px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = "Volatility Forecast" ;
        title.style.cssText = `
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
            font-weight: bold;
        `;

        volatilityValueElement = document.createElement('div');
        volatilityValueElement.id = 'volatility-value-display';
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
        
        // Insert the volatility value container before other elements in the right column
        const firstChild = rightColumn.firstChild;
        if (firstChild) {
            rightColumn.insertBefore(volatilityValueContainer, firstChild);
        } else {
            rightColumn.appendChild(volatilityValueContainer);
        }
    }
    
    return volatilityValueElement;
}

// NEW: Function to add forecast period display
function addForecastPeriodDisplay() {
    createMainContainer();
    const rightColumn = document.getElementById('right-column');
    
    let forecastPeriodElement = document.getElementById('forecast-period-display');
    if (!forecastPeriodElement) {
        // Create container for forecast period
        const forecastPeriodContainer = document.createElement('div');
        forecastPeriodContainer.id = 'forecast-period-container';
        forecastPeriodContainer.style.cssText = `
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

        forecastPeriodElement = document.createElement('div');
        forecastPeriodElement.id = 'forecast-period-display';
        forecastPeriodElement.style.cssText = `
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

        forecastPeriodContainer.appendChild(title);
        forecastPeriodContainer.appendChild(forecastPeriodElement);
        
        // Add the forecast period container to the right column
        rightColumn.appendChild(forecastPeriodContainer);
    }
    
    return forecastPeriodElement;
}

// Function to update volatility value display
function updateVolatilityValue(volatility) {
    const volatilityValueElement = addVolatilityValueDisplay();
    if (volatilityValueElement && volatility !== null && volatility !== undefined) {
        volatilityValueElement.textContent = `${volatility.toFixed(2)}%`;
        volatilityValueElement.style.color = '#2c5aa0';
    } else if (volatilityValueElement) {
        if (gaugeConfig.isLoading) {
            volatilityValueElement.textContent = 'Loading...';
            volatilityValueElement.style.color = '#666';
        } else {
            volatilityValueElement.textContent = 'No data';
            volatilityValueElement.style.color = '#999';
        }
    }
}

// NEW: Function to update forecast period display
function updateForecastPeriodDisplay() {
    const forecastPeriodElement = addForecastPeriodDisplay();
    if (forecastPeriodElement) {
        const periodText = getPeriodDisplayText(gaugeConfig.selectedPeriod);
        forecastPeriodElement.textContent = periodText;
        forecastPeriodElement.style.color = '#2c5aa0';
    }
}

// Function to add custom timestamp display after gauge initialization
function addTimestampDisplay() {
    createMainContainer();
    const statusColumn = document.getElementById('status-column');
    
    let timestampElement = document.getElementById('timestamp-display');
    if (!timestampElement) {
        // Create container for timestamp
        const timestampContainer = document.createElement('div');
        timestampContainer.id = 'timestamp-container';
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
        timestampElement.id = 'timestamp-display';
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
function addDescriptionDisplay() {
    createMainContainer();
    const statusColumn = document.getElementById('status-column');

    let descriptionElement = document.getElementById('volatility-description');
    if (!descriptionElement) {
        // Create container for description
        const descriptionContainer = document.createElement('div');
        descriptionContainer.id = 'description-container';
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
        descriptionElement.id = 'volatility-description';
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
function updateTimestampDisplay(timestamp) {
    const timestampElement = addTimestampDisplay();
    if (timestampElement && timestamp) {
        const formattedTime = formatTimestamp(timestamp);
        timestampElement.textContent = formattedTime;
        gaugeConfig.lastUpdateTime = timestamp;
    } else if (timestampElement) {
        if (gaugeConfig.isLoading) {
            timestampElement.textContent = 'Loading...';
        } else {
            timestampElement.textContent = 'No data';
        }
    }
}

// Function to update the volatility description text
function updateVolatilityDescription(description) {
    const descriptionElement = addDescriptionDisplay();
    if (descriptionElement) {
        descriptionElement.textContent = description || 'Awaiting data';
    }
}

// Function to update gauge range and recalculate zones
function updateGaugeRange(minVal, maxVal) {
    gaugeConfig.minValue = minVal;
    gaugeConfig.maxValue = maxVal;
    
    gauge.options.minValue = minVal;
    gauge.options.maxValue = maxVal;
    gauge.options.majorTicks = generateMajorTicks(minVal, maxVal);
    gauge.options.highlights = calculateColorZones(minVal, maxVal);
    
    gauge.draw();
    
    console.log(`Updated gauge range: ${minVal} - ${maxVal}`);
    console.log('New color zones:', calculateColorZones(minVal, maxVal));
}

// Function to fetch data from API
async function fetchVolatilityData() {
    try {
        const currentUrl = getCurrentUrl();
        console.log(`Fetching data from: ${currentUrl}`);
        
        const response = await fetch(currentUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Hide loading state once data is received
        hideLoadingState();
        
        const volatility = data.metrics.volatility;
        const timestamp = data.timestamp;
        const horizon = data.horizon;
        
        const currentMin = gaugeConfig.minValue;
        const currentMax = gaugeConfig.maxValue;
        
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
            updateGaugeRange(newMin, newMax);
        }

        // Update gauge needle position only (no text display on gauge)
        gauge.value = volatility;
        
        // Update all displays including the new volatility value and forecast period
        updateVolatilityValue(volatility); // Update volatility value display
        updateForecastPeriodDisplay(); // Update forecast period display
        updateTimestampDisplay(timestamp);
        const description = getVolatilityDescription(volatility, newMin, newMax);
        updateVolatilityDescription(description);
        
        console.log(`Updated volatility: ${volatility}% (${gaugeConfig.selectedCrypto}, ${gaugeConfig.selectedPeriod} days)`);
        console.log(`Current range: ${newMin} - ${newMax}`);
        console.log(`Last update: ${formatTimestamp(timestamp)}`);
        
        return data;
    } catch (error) {
        console.error('Error fetching volatility data:', error);
        
        // Hide loading state on error
        hideLoadingState();
        
        const fallbackValue = 0;
        gauge.value = fallbackValue;
        
        // Update displays on error
        updateVolatilityValue(null); // Update volatility value display on error
        updateForecastPeriodDisplay(); // Update forecast period display
        updateTimestampDisplay(null);
        updateVolatilityDescription("Data unavailable");
    }
}

// Function to start/restart data updates
function startDataUpdates() {
    // Clear existing interval if any
    if (gaugeConfig.intervalId) {
        clearInterval(gaugeConfig.intervalId);
    }
    
    // Fetch data immediately
    fetchVolatilityData();
    
    // Set up new interval
    gaugeConfig.intervalId = setInterval(fetchVolatilityData, 10000);
}

// Function to stop data updates (useful for cleanup)
function stopDataUpdates() {
    if (gaugeConfig.intervalId) {
        clearInterval(gaugeConfig.intervalId);
        gaugeConfig.intervalId = null;
    }
}

// Start the data updates when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the crypto selector first
    addCryptoSelector();
    
    // Initialize the period selector
    addPeriodSelector();
    
    // Initialize display elements with placeholder text
    updateVolatilityValue(null); // Initialize volatility value display
    updateForecastPeriodDisplay(); // Initialize forecast period display
    updateTimestampDisplay(null);
    updateVolatilityDescription("Awaiting data");
    
    // Initialize logo display
    addLogoDisplay();
    
    // Start data updates
    startDataUpdates();
});

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    stopDataUpdates();
});