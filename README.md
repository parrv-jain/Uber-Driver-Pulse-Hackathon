# Driver Pulse : Team BlackBugs(Group - 17)
### Demo Video
[Drive Link](https://drive.google.com/file/d/1887Z2-Dy-wcJr3HVHhVNitxCINSwW_GZ/view?usp=drivesdk)

### Live Application
[DriverOS](https://uber-driver-pulse-hackathon-frontend.onrender.com/)

### Credentials
- Driver - driver123
- UberAdmin - admin123
### Note to judges
- The Processed_logs folder is generated at **/log**
- Don't start a ride before registration of driver and setting shiftHours and Earning Goals.
- Snapshots are generated randomly at an interval of 30 seconds.
- So we request you to wait for atleast 2 minutes before ending a ride to be able to see atleast 4 snapshot readings
- Output CSVs exist in /log
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
cd source_code/backend
mvn clean install
mvn spring-boot:run
```
Backend runs on **http://localhost:8080**

### 3. Start the Frontend
```bash
cd source_code/frontend/driver-dashboard
npm install
npm start
```
Frontend runs on **http://localhost:3000**

---

## Problem Statement

Uber drivers face significant stress during their shifts — from harsh road conditions to difficult passengers — but there's currently no system to monitor or respond to these stress signals in real time. **DriverOS** bridges this gap by tracking driver stress through simulated sensors and giving both drivers and Uber admins actionable insights.

## Solution

DriverOS is a full-stack platform with **two perspectives**:

- **Driver POV** — Drivers can start shifts, accept/reject rides, track earnings, and monitor their own stress levels in real time.
- **Admin POV** — Uber admins can monitor all rides platform-wide, review flagged stress moments, and get a high-level operations overview.

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
- **Audio Level Classification Levels** — detects sustained high decibel levels (quiet, conversational, argument, very loud)
- **Motion Level Classification Levels** — detects harsh braking and acceleration(Gradual, Moderate, Harsh)
- **Stress Level Classification Levels** — average combination with 50% audio, 50% motion(Low, Medium, High, Critical)
- **3 Stress Strategies** — Average, Peak, Weighted (dynamice switchable per ride)

---

## Project Structure

```
Uber-Driver-Pulse-Hackathon/
├── source_code/
│   ├── backend/                          # Spring Boot Backend
│   │   ├── backend/                      # Maven project root
│   │   ├── src/main/java/com/uber/
│   │   │   ├── controller/               # REST API endpoints
│   │   │   ├── models/                   # Driver, Ride, Shift, etc.
│   │   │   ├── service/                  # Core business logic
│   │   │   ├── repository/               # In-memory data store
│   │   │   ├── strategy/                 # Stress rating strategies
│   │   │   └── enums/                    # Status enums
│   │   ├── Dockerfile                    # Docker config for Render deployment
│   │   └── pom.xml                       # Maven dependencies
│   │
│   └── frontend/                         # React Frontend
│       ├── driver-dashboard/             # Next.js / React app
│       │   └── src/
│       │       ├── components/
│       │       │   ├── LandingPage.js    # Splash + role selection + login
│       │       │   ├── Sidebar.js        # Navigation sidebar
│       │       │   ├── Dashboard.js      # Driver dashboard
│       │       │   ├── AvailableRides.js # Ride request list
│       │       │   ├── StressMonitor.js  # Real-time stress charts
│       │       │   ├── Report.js         # Driver report
│       │       │   ├── AdminDashboard.js # Admin operations view
│       │       │   ├── RegisterModal.js  # Driver registration modal
│       │       │   └── UI.js             # Shared UI components
│       │       ├── hooks/
│       │       │   └── useToast.js       # Toast notifications
│       │       ├── api.js                # API helper functions
│       │       └── App.js                # Root app with routing
│       └── package-lock.json
│
├── System_Architecture/                  # Architecture diagrams & docs
├── .gitignore
├── DesignDocument.pdf
├── Progress_log.pdf
└── README.md
```

---
## Architecture Diagram
<img width="1834" height="940" alt="image" src="https://github.com/user-attachments/assets/432c2149-6c75-4126-95f7-f3c276e8d55f" />
<img width="1814" height="811" alt="image" src="https://github.com/user-attachments/assets/e705d157-fcf2-48a9-bc2a-a1c9008cf99e" />
<img width="1819" height="248" alt="image" src="https://github.com/user-attachments/assets/29883329-1cc8-4612-a2b3-5a346fb1798e" />

## Architecture in-words

- Initially the driver visits the site, enter his name, start time(which is set to current time), end time , earning goal and "starts"  his shift. This action
	- **calls Shift Service** which "stores" this information in **Driver Repository**
- Then the driver generates rides. This
	- **calls Ride Request Generator service** which generates rides between a random number from 6 - 10, and forms a ride request(we have already given a prebuilt array of 15 locations on mumbai to choose pickup and dropoff from).
	- Each **ride request is an entity (model)** that gets  a random ride-request-id, picks up random coordinates, find distance between them and calculates fare. We estimate the duration of the ride-request.
	- Each ride-request gets "**stored**" in **Ride Request Repository**
- The Driver can accept or reject a ride request
	- On rejecting : the ride request is "removed" from ride Request repository
- The driver accepts a ride Request. This
	- **calls Ride Service** that converts ride-request into ride, each ride is given a unique id, alloted a driver( i.e . driver_id) , change it's status as **_ONGOING_**.
	- The information of driver and ride(driver id and ride id) is **stored in Driver Repository and Ride Repository**
- Now the simulation takes place, random stress signals are generated at an interval of 30 seconds. This is handled by **calling Ride Simulation Scheduler**(it ticks every 30 seconds and is implemented via _thread sleep_)
- **Sensor Simulator Service** generates acceleration Reading and generates audio Reading(when called in every 30 seconds).
- This creates **new instance** of_ Audio Data_ and _Motion Data_
- Now each of this instance is created in new **instance of Sensor Reading**, and a timestamp is alloted to Sensor Reading
- **Stress Score Service** -
	- uses Stress Snapshot to calculate AudioScore and MotionScore, and CombinedScore.
	- Searches for flags by comparing flag-thresholds.
	- At this instant, we also compute current and target earning velocity by **model Earning Velocity** that stores the two velocities along with velocity delta and pace status(ahead or on track or critical)
- All this is logged by **CSVLogger** into required target CSVS
- While Logging, We use **enums** to classify and 
	- allot motion, audio, stress flags to the Ride
	- classify the pace_status (ahead, on track, behin, critical).
- When a driver ends his ride (it automatically ends after duration of ride is complete, but driver can end it on his end too).
	- Ride Service is called to mark the ride's status as *COMPLETED*
    - His shift is marked as _ENDED_ by calling **ShiftService**
	- Driver's current Earnings are increased.
	- **Stress-Rating-Service **
		- calculates entire ride's stress scores(motion, audio and combined)
		- chooses amongst 4 different strategies provided(by default - it is average)
	- Data logging is taken care of by **CSVLogger**
	- Ride Simulation Scheduler is halted.
	- Driver is displayed the combined score and is **provided a feedback.**


#### For in-depth Documentation of each designPattern, please visit [docs](/System_Architecture/docs)
---
## Sample Outputs
### Live Stress Rating and Earning Velocity Monitor
<img width="1615" height="889" alt="image" src="https://github.com/user-attachments/assets/1fb47b50-71d5-493d-b73a-45ef9fd4e63e" />
<img width="1641" height="984" alt="image" src="https://github.com/user-attachments/assets/a22d47f2-2890-4318-b071-1c99b176653f" />

### Feedback at the end of each ride
<img width="886" height="929" alt="image" src="https://github.com/user-attachments/assets/29f9bc2a-dd7a-41d7-ac88-e1fba0a6fc74" />
<img width="1222" height="599" alt="image" src="https://github.com/user-attachments/assets/687519cc-f06d-4a3e-9966-f4352c8961d8" />

### Admin View, get reasoning of all flags collected
<img width="1635" height="921" alt="image" src="https://github.com/user-attachments/assets/386586d5-0f9c-480c-9bbb-2c72eb1300a7" />
<img width="1604" height="629" alt="image" src="https://github.com/user-attachments/assets/957bd9ef-636d-4aa9-85df-10fda6f97156" />
<img width="1635" height="921" alt="image" src="https://github.com/user-attachments/assets/40a12a31-4174-449f-8267-d7ef58a45136" />

### View the CSVs locally
<img width="1851" height="211" alt="image" src="https://github.com/user-attachments/assets/35106fbc-83f4-4d89-971b-aa7283844218" />
---

#### Please note that we were not able to take processed_logs outside the backend folder. They will be available at
_source_code/backend/backend/logs_

## Tech Stack

| Layer     | Technology          |
|-----------|---------------------|
| Backend   | Java 17 + Spring Boot |
| Frontend  | React.js            |
| Data      | In-memory repositories + CSV logging |
| Build     | Maven               |


Built with atmost sincerity for the **Uber Hackathon 2026**
# Contributors
- [Pranjal Kabra](https://github.com/PranjalKabra)
- [Parrv Jain](https://github.com/parrv-jain)
- [Nidhi Maria Snatosh](https://github.com/Nidhi-Maria)

