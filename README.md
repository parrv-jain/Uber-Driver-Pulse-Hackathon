# Driver Pulse : Team BlackBugs
### Demo Video
### Live Application
### Credentials
- Driver - driver123
- UberAdmin - admin123
### Note to judges
- Snapshots are generated randomly at an interval of 30 seconds.
- So we request you to wait for atleast 2 minutes before ending a ride to be able to see atleast 4 snapshot readings
---
## Problem Statement

Uber drivers face significant stress during their shifts — from harsh road conditions to difficult passengers — but there's currently no system to monitor or respond to these stress signals in real time. **DriverOS** bridges this gap by tracking driver stress through simulated sensors and giving both drivers and Uber admins actionable insights.

## Solution

DriverOS is a full-stack platform with **two perspectives**:

- **Driver POV** — Drivers can start shifts, accept/reject rides, track earnings, and monitor their own stress levels in real time.
- **Admin POV** — Uber admins can monitor all rides platform-wide, review flagged stress moments, and get a high-level operations overview.

---

## Features

### Driver Dashboard
- Register and start a shift with an earning goal
- Generate and accept/reject ride requests
- Real-time stress monitoring (audio + motion sensors -> here random readings are generated after every 30 seconds)
- Real-time Earning velocity tracker — shows if you're on pace to hit your goal
- End-of-shift report with completed rides and stress ratings

### Admin Dashboard
- Platform-wide stats (total rides, ongoing rides, flags, revenue)
- View generate CSVs in readable UI
- Feature to download generated CSVs with flagged moments.
- Full ride table with driver name, route, fare, stress rating, and flag count
- Flagged moments table — pulled from live CSV logs with detailed explanations
- Auto-refreshes every 15 seconds

### Stress Detection Engine
- **Audio Level Classification Levels** — detects sustained high decibel levels (quiet, conversational, arguement, very loud)
- **Motion Level Classification Levels** — detects harsh braking and acceleration(Gradual, Moderate, Harsh)
- **Stress Level Classification Levels** — weighted combination with 40% audio, 60% motion(Low, Medium, High, Critical)
- **3 Stress Strategies** — Average, Peak, Weighted (switchable per ride)

---

## Project Structure

```
Uber-Driver-Pulse-Hackathon/
├── uber/                          # Spring Boot Backend
│   ├── src/main/java/com/uber/
│   │   ├── controller/            # REST API endpoints
│   │   ├── models/                # Driver, Ride, Shift, etc.
│   │   ├── service/               # Core logic
│   │   ├── repository/            # In-memory data store
│   │   ├── strategy/              # Stress rating strategies
│   │   └── enums/                 # Status enums
│   └── log/                       # CSV logs (auto-generated)
│       ├── flagged_moments.csv    # outputs generated
│       ├── ride_summary_log.csv
│       ├── audio_sensor_log.csv
│       └── motion_sensor_log.csv
│
└── frontend/driver-dashboard/     # React Frontend
    └── src/
        ├── components/
        │   ├── LandingPage.js     # Splash + role selection + login
        │   ├── Sidebar.js         # Navigation sidebar
        │   ├── Dashboard.js       # Driver dashboard
        │   ├── AvailableRides.js  # Ride request list
        │   ├── StressMonitor.js   # Real-time stress charts
        │   ├── Report.js          # Driver report
        │   ├── AdminDashboard.js  # Admin operations view
        │   ├── RegisterModal.js   # Driver registration
        │   └── UI.js              # Shared UI components
        ├── hooks/useToast.js      # Toast notifications
        ├── api.js                 # API helper functions
        └── App.js                 # Root app with routing
```

---
## Architecture Diagram


## Documentation


#### For in-depth Documentation of each designPattern, please visit [docs](/docs)
---
## Run Locally
### Prerequisites
- Java 17+
- Maven 3.6+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/PranjalKabra/Uber-Driver-Pulse-Hackathon.git
cd Uber-Driver-Pulse-Hackathon
```

### 2. Start the Backend
```bash
cd uber
mvn clean install
mvn spring-boot:run
```
Backend runs on **http://localhost:8080**

### 3. Start the Frontend
```bash
cd frontend/driver-dashboard
npm install
npm start
```
Frontend runs on **http://localhost:3000**

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Backend   | Java 17 + Spring Boot |
| Frontend  | React.js            |
| Data      | In-memory repositories + CSV logging |
| Build     | Maven               |




Built with ❤️ for the **Uber Hackathon 2026**
This project was built for hackathon purposes.
