# ENUMS
Enums are used to represent **fixed sets of constants** that define specific states, categories, or types within the system.

---
## AudioRating
Classify audio score into
- Quiet (0.00, 0.25)
- Conversational (0.25, 0.50)
- Argument()
- VeryLoud()
#### Usage -
1. StressSnapshot.java - to find the "flag" according to the given audioScore.
---
## MotionRating
Classify motion score into
- Gradual(0.00, 0.25)
- Moderate(0.25, 0.60)
- Harsh(0.60, 1.00)
#### Usage -
1. StressSnapshot.java - to find the "flag" according to the given motionScore.
---
## PaceStatus
Classify Ride's Live status in accordance to target(required) earning velocity as compared to current earning velocity.
- Ahead (> 110% of required earning velocity)
- On_track (current velocity within ±10% of required)
- Behind (current velocity 70–90% of required)
- Cricital (current velocity < 70% of required)
#### Usage -
1. EarniingVelocity.java - uses paceStatus to generate ride velocity summary
2. EarningVelocityService.java - uses paceStaus to classify the ride on the basis of target earning velocity and current earning velocity.
---
## RideStatus
Classify each Ride as
- Ongoing
- Completed
#### Usage -
1. DriverController.java
2. Ride.java
3. Driver.java
4. CSVLogger.java
5. EarningVelocityService.java
6. RideService.java
---
## ShiftStatus
Classify each Driver's shift as the following
- Not_Started
- Active
- Ended
#### Usage -
1. Shift.java - changes the Driver's shift-status when a driver registers, starts or ends his trip.