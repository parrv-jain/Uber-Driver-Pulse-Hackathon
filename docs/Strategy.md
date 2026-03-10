# Strategy
The Strategy pattern in Java is a design pattern where multiple algorithms or behaviors are defined as separate classes implementing a common interface.

It allows a program to choose the behavior dynamically at runtime without changing the code that uses it.
## StressRatingStrategy(interface)
#### calculate(snapshots)
- Takes a `List<StressSnapshot>` and returns a `StressRating`
- Every concrete strategy must `implement` its own logic for reducing the list down to a single rating
#### getName()
- Returns the human-readable name of the strategy

---
## AverageStressStrategy

#### calculate(snapshots)
- Returns `StressRating.LOW` if the list is null or empty
- Streams through all snapshots and computes the ***mean*** of their `combinedScore`
- Passes the average into `StressRating.fromScore()` and returns the result
#### getName()
- Returns `"Average Stress Strategy"`
---
## PeakStressStrategy

#### calculate(snapshots)
- Returns `StressRating.LOW` if the list is null or empty
- Streams through all snapshots and finds the **maximum** `combinedScore`
- Passes the peak into `StressRating.fromScore()` and returns the result
#### getName()
- Returns `"Peak Stress Strategy"`

---

## WeightedStressStrategy

#### Attributes
- `RECENT_WEIGHT = 1.5` - weight applied to snapshots in the last 1/3 of the ride
- `OLDER_WEIGHT = 1.0` - weight applied to all earlier snapshots
#### calculate(snapshots)
- Returns `StressRating.LOW` if the list is null or empty
- Computes `recentCutoff` as `size - max(1, size/3)` — everything from this index onward is considered "recent"
- Iterates through all snapshots, applying `RECENT_WEIGHT` to recent ones and `OLDER_WEIGHT` to older ones
- Computes `weightedAvg = weightedSum / totalWeight`
- Passes the result into `StressRating.fromScore()` and returns the rating
#### getName()
- Returns `"Weighted Stress Strategy"`