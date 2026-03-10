# Models
In Java, models are classes that represent the data or entities of a program.

They define the fields (attributes) and methods that describe the properties and behavior of real-world objects.

Models are used to store and organize data within an application.
## AudioData

#### Attributes
- `decibels`
- `sustainedSeconds`
#### Constructor
- initializes the above mentioned attributes
#### getters
-  getDecibels()
- getSustainedSeconds()
---
## Driver
### Attributes :
- `id` - generate 8 char random driverId by `UUID.randomUUID()`
- `name` -  passed in constructor
- `currentShift` - instance of Shift
- `earningGoal` - instance of EarningGoal
- `rides` - List < Ride >
### Methods :
##### Constuctor
- Takes name as input
- generates 8 char id by `UUID.randomUUID()`
- intializes rides as empty `ArrayList()`
#### addRide(ride)
- append ride into `rides`
#### getRidesbyStatus(status)
- returns a list of rides that have `ride.status == status`
#### getTotalEarned(timestamp)
- `res` = total earned by rides whose status are COMPLETED
- `ongoing`= atmost one ride that has status ONGOING in the rides
- calculates tripPassed as total time that has passed from the point that the trip started.
- calulates the amount earned in trip as
  `ongoing_earned = (trip_fare/trip_duration)*trip_passed`
- returns the sum `ongoing_earned + res`
#### hasOngoingRide()
- Returns a boolean if there exist a ride whose status is ONGOING in driver's ride list.
#### getters
- getId() - returns id
- getName() - returns name
- getCurrentShift() - returns currentShift
- getEarningGoal - returns earningGoal
- getRides - returns unmodifiableList(rides)
#### setters
- setCurrentShift(shift)
- setEarningGoal(goal)
---
## EarningGoal
### Attributes
- `targetAmount`
- `currentEarned`
- `earningVelocity`
### Methods
#### Constructor
- intialises `targetAmount` as specified by the driver
- intialises `currentEarned = 0.0`
- intialises `earningVelocity = null`.
#### addEarning(amount)
- adds amount to `currentEarned`
#### getRemainingTarget
- returns `targetAmount - currentEarned`
- clip negative values to 0
#### isGoalMet
- returns if `currentEarned >= targetAmount`
#### setters
- setEarningVelocity
#### getters
- getEarningVelocity()
- getTargetAmount()
- getEarningVelocity()
---

## EarningVelocity
#### Attributes
- `currentVelocity` - amount earned so far, it runs live with ongoing ride
- `requiredVelocity` - (target - amount earned)/leftover time in the shift
- `veloctiyDelta` - difference is requiredVelocity and currentVelocity
- `paceStatus` depending on velocityDelta, if the rider is Ahead, onTrack or critical
- `timeStamp` - current time
#### Constructor
- initializes the attributes mentioned above
- uses `LocalDateTime.now()` to set timestamp.
#### getters
- getSummary() - returns a string of paceStatus, currentVelocity and RequiredVelocity
- getCurrentVelocity()
- getRequiredVelocity()
- getPaceStatus()
- getVelocityDelta()
---
## Location
#### Attributes
- `latitude` - a randomly generated latitude for the  pickup/dropoff location
- `longitude` - a randomly generated longitude  for the  pickup/dropoff location
- `label` - some place in Mumbai  for the  pickup/dropoff location
#### Constructor
- initializes the attributes mentioned above
#### Location
- uses the OG Haversine formula to find distance (in km) between two given coordinates
  ![[Pasted image 20260309224323.png|249]]
  Where  phi is latitude, lambda is longitude in radians, R is Earth's radius (6371 km), and c is the angular distance.
#### getters
- getLatitude() -
- getLongitude()
- getLabel()
---

## MotionData
#### Attributes
- `acc_x` - acceleration in x direction (rigt - left) - sharp turns
- `acc_y` - acceleration in y direction (front - back) - harsh breaking/sudden acceleration
- `acc_z` - acceleration in z - direction (almost constant = 9 = 9.8m/s2)
- `latitude` - randomly generated latitude of the place where snapshot was generated.
- `longitude` randomly generated longitude of the place where snapshot was generated.
#### Constructor
- initializes the  Attributes mentioned above.
#### getters
- getAcceleration() - returns
    - |acceeration| = sqrt((acc_x^2) + (acc_y^2));
- getLatitude()
- getLongitude()
- getAcc_x()
- getAcc_y()
-  getAcc_z()
---

## Ride
#### Attributes
- `id` - ride id(generated after a rideRequest gets accepted by a driver)
- `driver` - driver handling that ride
- `request` - rideRequest which has turned to this ride
- `status` - ongoing or completed ride
- `startTime` - time at which it is accepted by a driver
- `endTime` - time at which it is ended by a driver
- `actualFare` - fair generated randomly for that ride
- `sensorReadings` - readings of sensors stored in ride as a list
- `stressSnapshots` - readings of snapshots stored in the ride as a list.
#### Constructor
- initializes the above mentioned attributes
- sets the `status` as ONGOING
- make a new `ArrayList()` for sensorReadings and stressSnapshots
#### addSensorReading(reading)
- append reading into the List sensorReadings
#### addStressSnapshot(snapshot)
- append snapshot into the List stressSnapshot
#### getters
- getDuration() - returns the duration between startTime an endTime of the ride.
- getAudioFlagcount() - streams in stressSnapshots to get count, by `filter(StressSnapshot::isAudioFlagged).count()`.
- getMotionFlagCount() - streams in stressSnapshots to get count, by `filter(StressSnapshot::isMotionFlagged).count()`.
- getTotalFlagCount() - applies OR logic and counts the snapshots where either motion was flagged or audio was flagged or both.
- getId()
- getDriver()
- getStatus()
- getStartTime()
- getEndTime()
- getActualFare()
- getStressRating()
- getStressSnapshots()
#### setters
- setStatus()
- setStartTime()
- setEndTime()
- setStressRating()
---
## StressSnapshot
#### Attributes
- `AUDIO_FLAG_THRESHOLD = 0.5`
- `MOTION_FLAG_THRESHOLD = 0.6`
- `timestamp` - timestamp at which snapshot was recorded
- `audioScore` - between [0, 1];
- `audioLevel` - audioRating in (4 categories)
- `motionScore` - between [0, 1];
- `motionLevel` - motionRating in (4 categories)
- `combinedScore` - weighted sum of motionScore and audioScore
- `combinedLevel` - categorization of combinedScore
- `audioFlagged` - boolean value
- `motionFlagged` - boolean value
- `earningVelocity` - EarningVelocity at the current timeStamp of the snapShot
#### Constructor
- initializes all the attributes mentioned above
- motionLevel is taken from enum MotionRating
- audioLevel is taken from enum AudioRating
- combinedLevel is taken from enum StressRating
- audioFlagged is true when `audioScore  >= AUDIO_FLAG_THRESHOLD`
- motionFlagged is true when `motionScore  >= MOTION_FLAG_THRESHOLD`
#### isFlagged()
- returns true if either of the `audioFlagged`  or `motionFlagged` is true.
#### getters
- getTimestamp()
- getAudioScore()
- getAudioLevel()
- getMotionScore()
- getMotionLevel()
- getCombinedScore()
- getCombinedLevel()
- isAudioFlagged()
- isMotionFlagged()
- getEarningVelocity()
---
## SensorReading
#### Attributes
- `rideId`
- `timestamp`
- `motionData`
- `audioData`
#### Constructor
- initializes all the attributes
#### getters
- getRideId()
- getTimestamp()
- getAudioData()
- getMotionData()
----
## Shift
#### Attributes
- `id`
- `driverId`
- `startTime`
- `endTime`
- `status`
#### Constructor
- initializes the above mentioned attributes
- id - shift is given random driverId by `UUID.randomUUID()`
- startTime - time at which driver Registers
- status - NOT_STARTED
#### isActive()
- returns true if current time is between driver's startTime and endTime
#### activate()
- change the driver's shiftStatus to ACTIVE
#### end()
- change the driver's shiftStatus to ENDED
#### getters
- getTotalShiftHours() - simply finds the duration between startTime and endTime
- getHoursWorked() - finds the time duration between the driver started his shift and ended his shift.
  Note - this can be different from totalShiftHours when the driver wants to end his shift before the endTime.
- getHoursRemaining() - returns the time difference between currentTime and  endTime
- getId()
- getStartTime()
- getEndTime()
- getStatus()
----
## RideRequest
#### Attributes
- `id`
- `pickupLocation`
- `dropLocation`
- `estimatedFare`
- `estimatedDistance`
- `estimatedDuration`
- `createdAt`
#### Constructor
- initializes all the attributes mentioned above.
- id - each rideRequest is given a random id by `UUID.randomUUID()`
- createdAt is set to current time by `LocalDateTime.now()`
#### getters
- getId()
- getPickupLocation()
- getDropLocation()
- getEstimatedFare()
- getEstimatedDistance()
- getEstimatedDuration()
- getCreatedAt()
---


