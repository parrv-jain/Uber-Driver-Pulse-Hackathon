# Service
Services process data, perform computations, and coordinate between controllers and repositories.

## CsvLogger

#### Attributes
- `LOG_DIR` - base directory for all log files (`uber/log/`)
- `EARNING_LOG` - path to earning velocity log csv
- `AUDIO_LOG` - path to audio sensor log csv
- `MOTION_LOG` - path to motion sensor log csv
- `RIDE_LOG` - path to ride summary log csv
- `FLAGGED_LOG` - path to flagged moments log csv
#### Constructor
- Creates the `uber/log/` directory if it doesn't exist
- Writes fresh headers to all 5 csv files on each run (overwrites previous headers)
#### logEarningVelocity(ev, driver, shift)
- Logs a row to `earning_velocity_log.csv`
- Captures: `log_id`, `driver_id`, `date`, `timestamp`, `current_earnings`, `elapsed_hours`, `curr_velocity`, `required_velocity`, `velocity_delta`, `trips_completed`, `forecast_status`
#### logAudioReading(reading, snapshot, driverId)
- Logs a row to `audio_sensor_log.csv`
- Captures: `log_id`, `ride_id`, `driver_id`, `timestamp`, `decibels`, `sustained_seconds`, `audio_score`, `audio_level`, `is_flagged`
#### logMotionReading(reading, snapshot, driverId)
- Logs a row to `motion_sensor_log.csv`
- Captures: `log_id`, `ride_id`, `driver_id`, `timestamp`, `acc_x`, `acc_y`, `acc_z`, `acceleration`, `latitude`, `longitude`, `motion_score`, `motion_level`, `is_flagged`

#### logRideSummary(ride)
- Logs a row to `ride_summary_log.csv` once a ride completes
- Captures: `ride_id`, `driver_id`, `driver_name`, `duration`, `distance`, `start_location`, `end_location`, `fare`, `motion_flag_count`, `audio_flag_count`, `flagged_moment_count`, `stress_rating`, `stress_rating_label`

#### logFlaggedMoment(snapshot, reading, ride)
- Skips logging entirely if neither audio nor motion was flagged
- Calculates `elapsedSeconds` as duration from ride start to the reading's timestamp
- Logs a row to `flagged_moments.csv` with: `flag_id`, `trip_id`, `driver_id`, `timestamp`, `elapsed_seconds`, `motion_score`, `motion_rating`, `audio_score`, `audio_rating`, `stress_score`, `stress_rating`, `explanation`
#### buildExplanation(snapshot, reading)
- Builds a human-readable explanation string for a flagged moment
- If both audio and motion are flagged: combines both descriptions with "Strong conflict indicator."
- If only motion is flagged: describes the harsh braking/acceleration event
- If only audio is flagged: describes the sustained high audio event
#### write(filename, line, append)
- Writes a single line to the given file
- `append = false` overwrites (used for headers), `append = true` appends (used for data rows)
---
## EarningVelocityService

#### Attributes
- `csvLogger` - instance of CsvLogger for persisting velocity snapshots
#### Constructor
- Takes `CsvLogger` as a dependency
#### calculate(driver, shift, currentTimestamp)
- finds `earned` by `driver.getTotalEarned(currentTimestamp)`
- `currentVelocity` = `earned / hoursWorked` (0.0 if no hours worked yet)
- `requiredVelocity` = `(target - earned) / hoursLeft` (`Double.MAX_VALUE` if no hours left)
- Derives `paceStatus` by comparing the two velocities
- Creates a new `EarningVelocity` object and sets it on the driver's earning goal
- Logs the result via `csvLogger.logEarningVelocity()`
- Returns the computed `EarningVelocity`
#### getProjectedEarnings(driver, shift, currentTimestamp)
- Returns `0.0` if no hours have been worked yet
- Projects total earnings at end of shift as `currentVelocity * totalShiftHours`
#### derivePaceStatus(current, required)
- Returns `CRITICAL` if `required <= 0` or `required == Double.MAX_VALUE`
- finds `ratio = current / required`
- `ratio > 1.10` → `AHEAD`
- `ratio > 0.90` → `ON_TRACK`
- `ratio > 0.70` → `BEHIND`
- else → `CRITICAL`
- note - there is +- (10%) margin kept for classification of paceStatus based on the ratio of two velocities.
---
## RideRequestGenerator

#### Attributes
- `MUMBAI_LOCATIONS` - a static 2D array of 15 real Mumbai locations, each entry holds `latitude`, `longitude`, and a place `label`
#### generate() _(static)_
- Generates a random batch of `6 to 10` ride requests
- For each request, picks two ***distinct*** locations from `MUMBAI_LOCATIONS` as pickup and dropoff
- finds `distanceKm` using `pickup.distanceTo(dropoff)`.
- Estimates `durationMinutes` as `distanceKm * 2.5` + a random traffic noise offset of up to 10 minutes
- Estimates `fare` using the formula: `(distanceKm * 11) + (durationMinutes * 1.5)`.
- Returns the list of generated `RideRequest` objects
---
## RideService
#### Attributes
- `rideRepo` - repository for saving and fetching rides
- `rideRequestRepo` - repository for managing pending ride requests
- `driverRepo` - repository for fetching driver data
- `csvLogger` - for logging ride summaries
- `earningVelocityService` - for recalculating earning velocity on ride completion
#### Constructor
- Injects all the above dependencies, by ***Dependency Injection***
#### acceptRide(driver, request)
- make a new `Ride` from the driver and request
- Sets status to `ONGOING`, sets `startTime` to now, sets `endTime` to now + estimated duration
- Removes the request from `rideRequestRepo`
- Saves the ride to `rideRepo` and adds it to the driver's ride list
- Returns the created `Ride`
#### rejectRide(request)
- Simply removes the request from `rideRequestRepo`
#### completeRide(ride)
- Throws `IllegalStateException` if the ride isn't `ONGOING`
- Sets status to `COMPLETED` and `endTime` to now
- Recalculates `EarningVelocity` and adds the ride's actual fare to the driver's earning goal
- Logs the ride summary by `csvLogger.logRideSummary()`
#### getRidesByDriver(driverId, status)
- Fetches the driver from `driverRepo` by id and returns their rides filtered by the given status

---
# RideSimulationScheduler

#### Attributes
- `INTERVAL_SECONDS = 30` - how often (in seconds) the simulation ticks
- `simulator` - instance of `SensorSimulator` for generating readings
- `scoreService` - instance of `StressScoreService` for computing snapshots
- `executor` - a `ScheduledExecutorService` with a thread pool of size 4
- `activeTasks` - a `ConcurrentHashMap` mapping `rideId → ScheduledFuture` to track and cancel running simulations
#### Constructor
- Takes `SensorSimulator` and `StressScoreService` as dependencies
#### startSimulation(ride, driver, shift)
- Schedules a repeating task at every `INTERVAL_SECONDS`
- Each tick: generates a `SensorReading`, takes a `StressSnapshot`, and appends both to the ride
- Prints the combined stress score and level on each tick
- Stores the `ScheduledFuture` in `activeTasks` keyed by `rideId`
#### stopSimulation(rideId)
- Removes the task from `activeTasks` and cancels it
- `cancel(false)` — lets the current tick finish before stopping

---
## SensorSimulator
#### Attributes
- `random` - a `Random` instance for generating values
- `BASE_LAT = 28.6139` - base latitude (around Mumbai) for motion location generation
- `BASE_LNG = 77.2090` - base longitude for motion location generation
#### generateReading(rideId)
- Generates and returns a `SensorReading` composed of a fresh `AudioData` and `MotionData` for the given `rideId`
#### generateAudio()
- `decibels` - random value in range `[40, 110]`
- `sustainedSeconds` - random value in range `[0, 20]`
- Returns a new `AudioData`
#### generateMotion() _(private)_
- `acc_x` - Gaussian around 0, std=3, clamped to `[-8, 8]` (lateral / sharp turns)
- `acc_y` - Gaussian around 0, std=3, clamped to `[-9, 9]` (front-back / harsh braking)
- `acc_z` - Gaussian around 9.8, std=0.05, clamped to `[9.7, 9.9]` (gravity, nearly constant)
- `lat/lng` - base coordinates offset by up to `±0.05` degrees for location variation
- Returns a new `MotionData`
---
## ShiftService
#### Attributes
- `driverRepo` - repository for persisting driver state
#### Constructor
- Takes `DriverRepository` as a dependency
#### startShift(driver, endTime)
- Throws `IllegalStateException` if the driver already has an active shift
- Creates a new `Shift` with `startTime = now` and the given `endTime`
- Activates the shift and sets it on the driver
- Saves the driver to `driverRepo` and logs the shift details to console
- Returns the created `Shift`
#### endShift(driver)
- Throws `IllegalStateException` if the driver has no active shift
- Calls `shift.end()` to mark it as ended
- Saves the driver to `driverRepo` and prints hours worked to console
---
## StressRatingService

#### Attributes
- `strategy` - the active `StressRatingStrategy`, defaults to `AverageStressStrategy`
#### Constructor
- Default constructor, initializes with `AverageStressStrategy`
#### rateRide(ride)
- Returns `StressRating.LOW` if the ride has no snapshots
- Otherwise `strategy.calculate(ride.getStressSnapshots())`
- Sets the computed rating on the ride via `ride.setStressRating()`
- Logs the rating and strategy name to console
- Returns the `StressRating`
#### setters
- `setStrategy(strategy)` - swaps in a new `StressRatingStrategy`
#### getters
- `getStrategy()` - returns the currently active strategy

---
## StressScoreService
#### Attributes
- `AUDIO_WEIGHT = 0.4` - weight of audio in the combined stress score
- `MOTION_WEIGHT = 0.6` - weight of motion in the combined stress score
- `earningVelocityService` - for computing live earning velocity at snapshot time
- `csvLogger` - for logging audio, motion, and flagged moment data
#### Constructor
- Takes `EarningVelocityService` and `CsvLogger` as dependencies
#### calcAudioScore(audio)
- `dbScore` = `(decibels - 30) / 90`
- `timeScore` = `(sustainedSeconds - 2) / 58`
- `raw` = `(0.65 * dbScore) + (0.35 * timeScore)`
- Returns result clamped to `[0.0, 1.0]`
#### classifyAudio(audioScore)
- segregate audio from enum `AudioRating.from(audioScore)` and returns the corresponding `AudioRating`
#### calcMotionScore(motion)
- Uses only lateral acceleration (ignores `acc_z`)
- `score` = `(acceleration - 2.0) / (8.0 - 2.0)` where 2.0 is the smooth threshold and 8.0 is the rough threshold
- Returns result clamped to `[0.0, 1.0]`
#### classifyMotion(motionScore)
- segregates motion from enum `MotionRating.from(motionScore)` and returns the corresponding `MotionRating`
#### calcCombined(audioScore, motionScore)
- Returns `(AUDIO_WEIGHT * audioScore) + (MOTION_WEIGHT * motionScore)`
#### takeSnapshot(reading, driver, shift, ride)
- Computes audio, motion, and combined scores from the sensor reading
- Calculates the current `EarningVelocity` at the reading's timestamp
- Constructs and returns a `StressSnapshot`
- Logs audio reading, motion reading, and any flagged moment via `csvLogger`
---
