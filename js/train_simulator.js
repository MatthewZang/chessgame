let speed = 0;
let distance = 0;
let trainElement = document.getElementById('train');
let speedElement = document.getElementById('speed');
let distanceElement = document.getElementById('distance');
let trainInterval;
let viewportElement;
let stationElement;
let track;
let platform;
let vancouverStation;
let isFirstStart = true;
let direction = 1; // 1 for forward, -1 for backward

// Update speed limit constant
const SPEED_LIMIT = 221; // Changed from 196 to 221 km/h
const ACCELERATION_RATE = 0.5; // How quickly the train accelerates
const DECELERATION_RATE = 0.3; // How quickly the train slows down
const DISTANCE_SCALE = 0.01;

let throttlePosition = 0; // Current throttle position (0-100)
let targetSpeed = 0; // Speed we're trying to reach based on throttle

// Initialize the simulation
function initializeSimulation() {
    // Create viewport
    viewportElement = document.createElement('div');
    viewportElement.className = 'viewport';
    
    // Get the container and controls/status elements
    const container = document.querySelector('.simulator-container');
    const controls = document.getElementById('controls');
    const status = document.getElementById('status');
    
    // Move only the track, platform, train, and station into viewport
    track = document.getElementById('track');
    platform = document.getElementById('platform');
    const train = document.getElementById('train');
    
    // Remove elements from container
    track.remove();
    platform.remove();
    train.remove();
    
    // Add elements to viewport
    viewportElement.appendChild(track);
    viewportElement.appendChild(platform);
    viewportElement.appendChild(train);
    
    // Create VIA station (first station)
    stationElement = document.createElement('div');
    stationElement.className = 'station';
    stationElement.style.left = '200px'; // Starting position
    viewportElement.appendChild(stationElement);
    
    // Create Jasper station (165km from VIA)
    const jasperStation = document.createElement('div');
    jasperStation.className = 'station jasper';
    jasperStation.style.left = '16700px'; // 165km * 100px per km
    viewportElement.appendChild(jasperStation);
    
    // Create Pacific Central station (345km from VIA)
    const pacificCentralStation = document.createElement('div');
    pacificCentralStation.className = 'station pacific-central';
    pacificCentralStation.style.left = '34500px'; // 345km * 100px per km
    viewportElement.appendChild(pacificCentralStation);
    
    // Create Vancouver station
    vancouverStation = document.createElement('div');
    vancouverStation.className = 'station vancouver';
    vancouverStation.style.left = '111000px'; // 1110km * 100px per km
    viewportElement.appendChild(vancouverStation);
    
    // Create Kamloops station (530km from VIA)
    const kamloopsStation = document.createElement('div');
    kamloopsStation.className = 'station kamloops';
    kamloopsStation.style.left = '53000px'; // 530km * 100px per km
    viewportElement.appendChild(kamloopsStation);
    
    // Create Union station (740km from VIA)
    const unionStation = document.createElement('div');
    unionStation.className = 'station union';
    unionStation.style.left = '74000px'; // 740km * 100px per km
    viewportElement.appendChild(unionStation);
    
    // Add viewport to container
    container.insertBefore(viewportElement, controls);
    
    // Set initial track and platform extent
    track.style.width = '120000px'; // Make sure track extends far enough
    platform.style.width = '120000px';
    
    // Set initial position
    updateViewport();

    // Initialize the throttle control
    initializeThrottleControl();

    // Start the movement loop
    trainInterval = setInterval(moveTrain, 50);

    // Create train map
    const trainMap = document.createElement('div');
    trainMap.className = 'train-map';
    
    const mapTrack = document.createElement('div');
    mapTrack.className = 'map-track';
    
    // Add stations to map
    const stations = [
        { name: 'VIA', position: 0 },
        { name: 'Jasper', position: 22.3 },      // 165km / 740km * 100
        { name: 'Pacific Central', position: 46.6 }, // 345km / 740km * 100
        { name: 'Kamloops', position: 71.6 },    // 530km / 740km * 100
        { name: 'Union', position: 100 }         // 740km / 740km * 100
    ];
    
    stations.forEach(station => {
        const mapStation = document.createElement('div');
        mapStation.className = 'map-station';
        mapStation.style.left = `${station.position}%`;
        mapStation.setAttribute('data-name', station.name);
        mapTrack.appendChild(mapStation);
    });
    
    // Add train marker
    const mapTrain = document.createElement('div');
    mapTrain.className = 'map-train';
    mapTrain.style.left = '0%';
    mapTrack.appendChild(mapTrain);
    
    trainMap.appendChild(mapTrack);
    document.body.appendChild(trainMap);

    // Store map train reference
    window.mapTrain = mapTrain;

    // Add after creating the train in initializeSimulation
    const carriage = document.createElement('div');
    carriage.className = 'carriage';
    viewportElement.appendChild(carriage);

    // After creating carriages, add the rear locomotive
    addRearLocomotive();
}

// Add new function to handle throttle changes
function updateThrottle(position) {
    throttlePosition = Math.max(0, Math.min(100, position));
    targetSpeed = (throttlePosition / 100) * SPEED_LIMIT;
}

// Modify moveTrain to handle gradual speed changes
function moveTrain() {
    // Gradually adjust speed based on throttle position
    if (speed < targetSpeed) {
        speed = Math.min(targetSpeed, speed + ACCELERATION_RATE);
        if (speed > 0) {
            isFirstStart = false;
        }
    } else if (speed > targetSpeed) {
        speed = Math.max(targetSpeed, speed - DECELERATION_RATE);
    }

    const currentLeft = parseInt(trainElement.style.left) || 0;
    const newLeft = currentLeft + (speed / 10) * direction;
    trainElement.style.left = newLeft + 'px';
    
    // Move carriage with the train
    const carriage = document.querySelector('.carriage:not(#rear-locomotive)');
    if (carriage) {
        carriage.style.left = (newLeft - 420) + 'px'; // Keep it 420px behind the locomotive
    }
    
    // Move rear locomotive
    const rearLocomotive = document.getElementById('rear-locomotive');
    if (rearLocomotive) {
        rearLocomotive.style.left = (newLeft - 840) + 'px'; // Keep it 840px behind the locomotive (420px behind the carriage)
    }
    
    // Update distance based on direction
    distance += ((speed / 10) * DISTANCE_SCALE) * direction;
    
    // Update speed and distance display
    speedElement.textContent = Math.abs(speed).toFixed(2) + ' km/h';
    distanceElement.textContent = distance.toFixed(2) + ' km';
    
    // Update viewport
    updateViewport();
    
    // Check if at a station
    checkStation(newLeft);
    
    // Update throttle display
    document.getElementById('throttle-value').textContent = `Throttle: ${throttlePosition}%`;
}

// Replace the old button event listeners with throttle control
function initializeThrottleControl() {
    const controls = document.getElementById('controls');
    
    // Create reverse throttle container
    const reverseContainer = document.createElement('div');
    reverseContainer.className = 'throttle-container';
    reverseContainer.innerHTML = `
        <div class="throttle-label">Reverse</div>
        <input type="range" id="reverse-throttle" min="0" max="100" value="0" 
               orient="vertical" class="throttle-slider">
        <div class="throttle-value">0%</div>
        <button id="emergency-stop" class="emergency-stop">EMERGENCY STOP</button>
    `;
    
    // Create forward throttle container
    const forwardContainer = document.createElement('div');
    forwardContainer.className = 'forward-throttle-container';
    forwardContainer.innerHTML = `
        <div class="throttle-label">Forward</div>
        <input type="range" id="forward-throttle" min="0" max="100" value="0" 
               orient="vertical" class="throttle-slider">
        <div class="throttle-value">0%</div>
        <div class="speed-label">Target Speed: <span id="target-speed">0</span> km/h</div>
    `;
    
    document.body.appendChild(reverseContainer);
    document.body.appendChild(forwardContainer);

    const forwardThrottle = document.getElementById('forward-throttle');
    const reverseThrottle = document.getElementById('reverse-throttle');
    const targetSpeedDisplay = document.getElementById('target-speed');
    const emergencyStop = document.getElementById('emergency-stop');

    // Forward throttle control
    forwardThrottle.addEventListener('input', (e) => {
        if (reverseThrottle.value > 0) reverseThrottle.value = 0;
        const position = parseInt(e.target.value);
        direction = 1;
        updateThrottle(position);
        e.target.nextElementSibling.textContent = `${position}%`;
        targetSpeedDisplay.textContent = Math.round(targetSpeed);
    });

    // Reverse throttle control
    reverseThrottle.addEventListener('input', (e) => {
        if (forwardThrottle.value > 0) forwardThrottle.value = 0;
        const position = parseInt(e.target.value);
        direction = -1;
        updateThrottle(position);
        e.target.nextElementSibling.textContent = `${position}%`;
        targetSpeedDisplay.textContent = Math.round(targetSpeed);
    });

    emergencyStop.addEventListener('click', () => {
        forwardThrottle.value = 0;
        reverseThrottle.value = 0;
        updateThrottle(0);
        targetSpeedDisplay.textContent = 0;
        document.querySelectorAll('.throttle-value').forEach(el => el.textContent = '0%');
    });
}

// Add CSS for the throttle control
const style = document.createElement('style');
style.textContent = `
    .throttle-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 10px;
        color: white;
    }

    .throttle-slider {
        width: 40px;
        height: 200px;
        -webkit-appearance: slider-vertical;
        margin: 20px 0;
    }

    .throttle-label, .speed-label {
        margin: 10px 0;
        font-size: 16px;
    }

    .emergency-stop {
        background-color: #ff3333;
        color: white;
        padding: 15px 30px;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        margin-top: 20px;
    }

    .emergency-stop:hover {
        background-color: #cc0000;
    }
`;
document.head.appendChild(style);

// Update the status display
function updateStatus() {
    speedElement.textContent = Math.round(speed);
    distanceElement.textContent = distance.toFixed(2);
    
    // Show warning if speed is at limit
    if (speed >= SPEED_LIMIT - 1) {
        if (!document.getElementById('speed-warning')) {
            const warning = document.createElement('div');
            warning.id = 'speed-warning';
            warning.textContent = 'Maximum Speed Reached!';
            warning.style.position = 'fixed';
            warning.style.top = '60px';
            warning.style.left = '50%';
            warning.style.transform = 'translateX(-50%)';
            warning.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            warning.style.color = 'white';
            warning.style.padding = '10px';
            warning.style.borderRadius = '5px';
            warning.style.zIndex = '1000';
            document.body.appendChild(warning);
            
            setTimeout(() => {
                warning.remove();
            }, 2000);
        }
    }
}

// Modify the updateViewport function to show more of the train
function updateViewport() {
    // Get the current train position
    const trainLeft = parseInt(trainElement.style.left) || 0;
    
    // Calculate viewport position - show more of the train by shifting the view
    // This will ensure we can see the rear locomotive
    const viewportLeft = -trainLeft + window.innerWidth / 3;
    
    // Apply the new position
    viewportElement.style.transform = `translateX(${viewportLeft}px)`;
    
    // Update distance display
    distance = Math.abs(trainLeft) * DISTANCE_SCALE;
    distanceElement.textContent = distance.toFixed(2) + ' km';
    
    // Update map train position
    if (window.mapTrain) {
        const maxDistance = 740; // km
        const percentPosition = Math.min(100, (distance / maxDistance) * 100);
        window.mapTrain.style.left = `${percentPosition}%`;
    }
}

// Modify the checkStation function to account for longer train
function checkStation(trainPosition) {
    // Get all stations
    const stations = document.querySelectorAll('.station');
    
    // Check if train is at any station
    let atStation = false;
    let stationName = '';
    
    stations.forEach(station => {
        const stationLeft = parseInt(station.style.left);
        const stationWidth = 2000; // Match the new station width
        
        // Expanded detection range to account for longer train
        if (Math.abs(trainPosition - stationLeft) < stationWidth / 2) {
            atStation = true;
            
            // Determine station name
            if (station.classList.contains('vancouver')) {
                stationName = 'Vancouver';
            } else if (station.classList.contains('jasper')) {
                stationName = 'Jasper';
            } else if (station.classList.contains('pacific-central')) {
                stationName = 'Pacific Central';
            } else if (station.classList.contains('kamloops')) {
                stationName = 'Kamloops';
            } else if (station.classList.contains('union')) {
                stationName = 'Union';
            } else {
                stationName = 'VIA';
            }
        }
    });
    
    // Update station arrival message
    const arrivalMessage = document.getElementById('arrival-message');
    if (atStation) {
        arrivalMessage.textContent = `You have arrived at ${stationName} station`;
        arrivalMessage.style.display = 'block';
    } else {
        arrivalMessage.style.display = 'none';
    }
}

// Add this at the beginning of your JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a selected train type in localStorage
    const selectedTrain = localStorage.getItem('selectedTrain');
    
    if (selectedTrain === 'rocky') {
        // Apply Rocky Mountaineer styling
        applyRockyMountaineerStyle();
    }
    
    // Initialize the simulator
    initializeSimulation();
});

// Function to apply Rocky Mountaineer styling
function applyRockyMountaineerStyle() {
    const trainElement = document.getElementById('train');
    const carriageElements = document.querySelectorAll('.carriage');
    
    // Rocky Mountaineer style for locomotive
    trainElement.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- Rocky Mountaineer Train -->
        <defs>
            <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23003366"/>
                <stop offset="100%" style="stop-color:%23002244"/>
            </linearGradient>
            <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23FFD700"/>
                <stop offset="100%" style="stop-color:%23DAA520"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Blue) -->
        <rect x="0" y="10" width="320" height="75" fill="url(%23rockyBody)"/>
        <!-- Gold Stripe at Middle -->
        <rect x="0" y="45" width="320" height="10" fill="url(%23goldStripe)"/>
        <!-- Triangular Front -->
        <path d="M320,10 L400,30 L400,85 L320,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window -->
        <path d="M335,30 L380,40 L380,70 L335,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="20" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="80" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="140" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="200" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="260" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <!-- RM Logo -->
        <text x="120" y="65" font-family="Arial" font-size="18" fill="%23FFD700" font-weight="bold">RM</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
    
    // Rocky Mountaineer style for carriages
    carriageElements.forEach(carriage => {
        carriage.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
            <!-- Rocky Mountaineer Carriage -->
            <defs>
                <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23003366"/>
                    <stop offset="100%" style="stop-color:%23002244"/>
                </linearGradient>
                <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23FFD700"/>
                    <stop offset="100%" style="stop-color:%23DAA520"/>
                </linearGradient>
                <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:%23111a2f"/>
                    <stop offset="100%" style="stop-color:%23203060"/>
                </linearGradient>
            </defs>
            <!-- Main Body (Blue) -->
            <rect x="0" y="10" width="400" height="75" fill="url(%23rockyBody)"/>
            <!-- Gold Stripe at Middle -->
            <rect x="0" y="45" width="400" height="10" fill="url(%23goldStripe)"/>
            <!-- Connector Ends -->
            <circle cx="0" cy="50" r="8" fill="%23222"/>
            <circle cx="400" cy="50" r="8" fill="%23222"/>
            <!-- Windows -->
            <rect x="30" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="95" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="160" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="225" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <rect x="290" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
            <!-- Undercarriage -->
            <rect x="0" y="85" width="400" height="15" fill="%23333"/>
            <!-- Wheels -->
            <circle cx="50" cy="90" r="8" fill="%23222"/>
            <circle cx="150" cy="90" r="8" fill="%23222"/>
            <circle cx="250" cy="90" r="8" fill="%23222"/>
            <circle cx="350" cy="90" r="8" fill="%23222"/>
        </svg>')`;
    });
}

// Add this function to create a rear locomotive
function addRearLocomotive() {
    // Create rear locomotive element
    const rearLocomotive = document.createElement('div');
    rearLocomotive.id = 'rear-locomotive';
    rearLocomotive.className = 'carriage rear-locomotive';
    
    // Set initial position (behind the last carriage)
    const carriages = document.querySelectorAll('.carriage');
    const lastCarriageIndex = carriages.length - 1;
    
    if (lastCarriageIndex >= 0) {
        const lastCarriage = carriages[lastCarriageIndex];
        const lastCarriageLeft = parseInt(lastCarriage.style.left || '-420px');
        rearLocomotive.style.left = (lastCarriageLeft - 420) + 'px';
    } else {
        rearLocomotive.style.left = '-840px'; // Position if no carriages
    }
    
    // Add to viewport
    viewportElement.appendChild(rearLocomotive);
    
    // Apply appropriate styling based on selected train
    const selectedTrain = localStorage.getItem('selectedTrain');
    if (selectedTrain === 'rocky') {
        applyRockyMountaineerRearStyle(rearLocomotive);
    } else {
        applyVIARailRearStyle(rearLocomotive);
    }
}

// Function to apply VIA Rail styling to rear locomotive
function applyVIARailRearStyle(rearLocomotive) {
    rearLocomotive.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- VIA Rail Rear Locomotive (Flipped) -->
        <defs>
            <linearGradient id="silverBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23f5f5f5"/>
                <stop offset="100%" style="stop-color:%23e0e0e0"/>
            </linearGradient>
            <linearGradient id="yellowStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23ffdd00"/>
                <stop offset="100%" style="stop-color:%23ffb700"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Silver) -->
        <rect x="80" y="10" width="320" height="75" fill="url(%23silverBody)"/>
        <!-- Black Middle Section -->
        <rect x="80" y="30" width="320" height="40" fill="%23111"/>
        <!-- Yellow Stripe at Top -->
        <rect x="80" y="15" width="320" height="15" fill="url(%23yellowStripe)"/>
        <!-- More Triangular Front (Flipped) -->
        <path d="M80,10 L0,30 L0,85 L80,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window (smaller, flipped) -->
        <path d="M65,30 L20,40 L20,70 L65,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="95" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="155" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="215" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="275" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <rect x="335" y="35" width="45" height="25" fill="url(%23windowGlass)"/>
        <!-- VIA Logo -->
        <text x="280" y="55" font-family="Arial" font-size="22" fill="%23ffdd00" font-weight="bold">VIA</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
}

// Function to apply Rocky Mountaineer styling to rear locomotive
function applyRockyMountaineerRearStyle(rearLocomotive) {
    rearLocomotive.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100">
        <!-- Rocky Mountaineer Rear Locomotive (Flipped) -->
        <defs>
            <linearGradient id="rockyBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23003366"/>
                <stop offset="100%" style="stop-color:%23002244"/>
            </linearGradient>
            <linearGradient id="goldStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23FFD700"/>
                <stop offset="100%" style="stop-color:%23DAA520"/>
            </linearGradient>
            <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111a2f"/>
                <stop offset="100%" style="stop-color:%23203060"/>
            </linearGradient>
            <linearGradient id="darkFront" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:%23111"/>
                <stop offset="100%" style="stop-color:%23000"/>
            </linearGradient>
        </defs>
        <!-- Main Body (Blue) -->
        <rect x="80" y="10" width="320" height="75" fill="url(%23rockyBody)"/>
        <!-- Gold Stripe at Middle -->
        <rect x="80" y="45" width="320" height="10" fill="url(%23goldStripe)"/>
        <!-- Triangular Front (Flipped) -->
        <path d="M80,10 L0,30 L0,85 L80,85 Z" fill="url(%23darkFront)"/>
        <!-- Front Window (Flipped) -->
        <path d="M65,30 L20,40 L20,70 L65,70 Z" fill="url(%23windowGlass)"/>
        <!-- Windows -->
        <rect x="95" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="155" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="215" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="275" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <rect x="335" y="20" width="45" height="20" fill="url(%23windowGlass)"/>
        <!-- RM Logo -->
        <text x="280" y="65" font-family="Arial" font-size="18" fill="%23FFD700" font-weight="bold">RM</text>
        <!-- Wheels -->
        <circle cx="50" cy="90" r="8" fill="%23222"/>
        <circle cx="150" cy="90" r="8" fill="%23222"/>
        <circle cx="250" cy="90" r="8" fill="%23222"/>
        <circle cx="350" cy="90" r="8" fill="%23222"/>
    </svg>')`;
} 