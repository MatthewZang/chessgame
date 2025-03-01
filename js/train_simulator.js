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

// Update speed limit constant
const SPEED_LIMIT = 196; // New speed limit in km/h
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
        { name: 'Jasper', position: 31.13 }, // 165km / 530km * 100
        { name: 'Pacific Central', position: 65.09 }, // 345km / 530km * 100
        { name: 'Kamloops', position: 100 } // 530km / 530km * 100
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
            isFirstStart = false;  // Train has started moving
        }
    } else if (speed > targetSpeed) {
        speed = Math.max(targetSpeed, speed - DECELERATION_RATE);
    }

    const currentLeft = parseInt(trainElement.style.left) || 0;
    const newLeft = currentLeft + speed / 10;
    trainElement.style.left = newLeft + 'px';
    
    distance += (speed / 10) * DISTANCE_SCALE;
    
    // Update map train position (530km total distance)
    const mapPosition = (distance / 530) * 100;
    window.mapTrain.style.left = `${Math.min(100, Math.max(0, mapPosition))}%`;
    
    updateStatus();
    updateViewport();
    checkStation(newLeft);
}

// Replace the old button event listeners with throttle control
function initializeThrottleControl() {
    const controls = document.getElementById('controls');
    controls.innerHTML = `
        <div class="throttle-container">
            <input type="range" id="throttle" min="0" max="100" value="0" 
                   orient="vertical" class="throttle-slider">
            <div class="throttle-label">Throttle: <span id="throttle-value">0</span>%</div>
            <div class="speed-label">Target Speed: <span id="target-speed">0</span> km/h</div>
            <button id="emergency-stop" class="emergency-stop">EMERGENCY STOP</button>
        </div>
    `;

    const throttleSlider = document.getElementById('throttle');
    const throttleValue = document.getElementById('throttle-value');
    const targetSpeedDisplay = document.getElementById('target-speed');
    const emergencyStop = document.getElementById('emergency-stop');

    throttleSlider.addEventListener('input', (e) => {
        const position = parseInt(e.target.value);
        updateThrottle(position);
        throttleValue.textContent = position;
        targetSpeedDisplay.textContent = Math.round(targetSpeed);
    });

    emergencyStop.addEventListener('click', () => {
        throttleSlider.value = 0;
        updateThrottle(0);
        throttleValue.textContent = 0;
        targetSpeedDisplay.textContent = 0;
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

function updateViewport() {
    const trainLeft = parseInt(trainElement.style.left) || 0;
    const windowWidth = window.innerWidth;
    const trainCenter = trainLeft + (trainElement.offsetWidth / 2);
    const offset = Math.max(0, trainCenter - (windowWidth / 2));
    
    // Update viewport position
    viewportElement.style.transform = `translateX(-${offset}px)`;
    
    // Check if we need to extend the track (increased the check distance)
    if (trainLeft > (parseInt(track.style.right) || 1000) - windowWidth) {
        track.style.right = (parseInt(track.style.right) || 1000) + 2000 + 'px';
        platform.style.right = track.style.right;
    }
}

function checkStation(trainPosition) {
    // Check stations
    const stationLeft = parseInt(window.getComputedStyle(stationElement).left) || 0;
    const jasperLeft = 16700 * DISTANCE_SCALE; // 165km from start
    const pacificCentralLeft = 34500 * DISTANCE_SCALE; // 345km from start
    const kamloopsLeft = 53000 * DISTANCE_SCALE; // 530km from start
    
    // Only announce if train is completely stopped (speed === 0) and not at first start
    if (speed === 0 && !isFirstStart) {
        // Check if train is at any station
        if (Math.abs(trainPosition - stationLeft) < 200) {
            announceArrival('VIA Station');
        } else if (Math.abs(trainPosition * DISTANCE_SCALE - jasperLeft) < 200) {
            announceArrival('Jasper');
        } else if (Math.abs(trainPosition * DISTANCE_SCALE - pacificCentralLeft) < 200) {
            announceArrival('Pacific Central');
        } else if (Math.abs(trainPosition * DISTANCE_SCALE - kamloopsLeft) < 200) {
            announceArrival('Kamloops');
        }
    }
}

function announceArrival(stationName) {
    const announcement = document.createElement('div');
    announcement.textContent = 'You have arrived at a station';  // Generic message for all stations
    announcement.style.position = 'fixed';
    announcement.style.top = '20px';
    announcement.style.left = '50%';
    announcement.style.transform = 'translateX(-50%)';
    announcement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    announcement.style.color = 'white';
    announcement.style.padding = '10px';
    announcement.style.borderRadius = '5px';
    announcement.style.zIndex = '1000';
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        announcement.remove();
    }, 3000);
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initializeSimulation); 