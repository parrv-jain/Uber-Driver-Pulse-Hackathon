# Controller
It acts as the bridge between the client (UI/API requests) and the backend business logic, usually calling services or repositories to process data.

## DriverController

#### Reference of REST API Endpoints:

-   POST `/api/driver/register` → register a driver + start shift\
-   GET `/api/rides/available` → list available ride requests\
-   POST `/api/rides/generate` → generate new ride requests\
-   POST `/api/rides/accept` → accept a ride\
-   POST `/api/rides/reject` → reject a ride\
-   POST `/api/rides/{rideId}/complete` → complete a ride\
-   GET `/api/rides/{rideId}/stress` → get stress snapshots for a ride\
-   POST `/api/rides/{rideId}/strategy` → switch stress strategy\
-   GET `/api/driver/{driverId}/report` → final report for driver\
-   POST `/api/shift/end` → end shift for driver

With the help of **Dependency Injection**, we inject: -
DriverRepository - RideRepository - RideRequestRepository -
ShiftService - RideService - SensorSimulator - StressRatingService -
StressScoreService - EarningVelocityService - RideSimulationScheduler

------------------------------------------------------------------------

## registerDriver

-   Creates a new instance of driver, add name, earning goal and update shift hours and start the shift now by `shiftService.startShift(driver, shiftEnd)`
-   Save this information in **driverRepository** by `driverRepo.save(driver)`
-   Returns a map of this information.

------------------------------------------------------------------------

## generateRides

-   Generate a list of random **rideRequests**, with the help of
    `RideRequestGenerator.generate()`.
-   Add all the rideRequests in **RideRequestRepository**.
-   Returns a map of count and the list of rideRequests.

------------------------------------------------------------------------

## getAvailableRides

-   Get all the **available rideRequests** stored in
    **RideRequestRepository** with the help of
    `rideRequestRepo.getAll()` method.
-   Returns a map of count and available rides.

------------------------------------------------------------------------

## acceptRide

-   Find the driver with the help of **driverId** in
    **driverRepository**.
-   Find the rideRequest with the help of **rideRequestId** in
    **rideRequestRepository**.
-   Construct a new ride by `rideService.acceptRide(driver, request)`.
-   Simulate sensors and process stress with the help of
    `scheduler.startSimulation`(ride, driver).
-   Return a map containing **rideId, dropOff, pickup, fare**.

------------------------------------------------------------------------

## rejectRide

-   Reject a **rideRequest** by removing it from
    **rideRequestRepository** using `rideService.rejectRide(reqOpt.get())`
-   Return a **success message**.

------------------------------------------------------------------------

## completeRide

-   Find the ride by **rideId** by `rideRepo.findById(rideId)`.
-   Stop the scheduler by `scheduler.stopSimulation(rideId)`
-   Use `ratingService.rateRide(ride)` to rate the ride.
-   Use `rideService.completeRide(ride)` to:
    -   mark the ride status as **completed**
    -   log data with `csvLogger.logRideSummary(ride)`
    -   increase the **actual earning of driver**
-   Use **velocityService** to calculate driver's current earning
    velocity and target earning velocity at the end of the ride.
-   Return a map of **rideId, status, fare, count of stressRating,
    audioFlags, motionFlags, totalFlags**.

------------------------------------------------------------------------

## getStressSnapshots

-   Find ride by **rideId** with the help of `rideRepository.findbyId(rideId)`.
-   Returns map of **timestamp, audioScore, audioLevel, motionScore, motionLevel, combinedScore, combinedLevel, audioFlagged, motionFlagged, currentVelocity, requiredVelocity, velocityDelta, paceStatus**.

------------------------------------------------------------------------

## getDriverReport

-   Find the driver with the help of `driverRepository.findById(driverId)`
-   Find the driver 's earningGoal with the help of ` driver.getEarningGoal()`.
-   Get the list of **completed rides** with the help of driver.
-   Stream into those completed rides to find **stressRating** of each
    ride and make it into a list.
-   Returns a map of **driverId, name, targetAmount, currentEarned, remainingEarned, goalMetStatus, completedRides list**.

------------------------------------------------------------------------

## endShift

-   Get the driver with the help of **driverId** using
    **driverRepository**.
-   Use `shiftService.endShift(driver)` to mark the shift as **ENDED**.
-   Return a map of **hoursWorked, goalMetStatus**.

------------------------------------------------------------------------

## Responsibility

DriverController acts as the entry point of the system.\
It receives HTTP requests, validates inputs and delegates the core
business logic to services such as RideService, ShiftService and
StressScoreService.\
The controller itself does not contain business logic and only
orchestrates the flow between repositories and services.

------------------------------------------------------------------------

## Dependency Flow

- DriverController → Service Layer → Repository Layer
- DriverController interacts with service classes to execute the core logic,
- while repositories are responsible for storing and retrieving entities.

------------------------------------------------------------------------
## Controller Interaction Diagram


