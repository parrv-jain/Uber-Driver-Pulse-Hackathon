package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.Ride;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import java.util.List;

public interface StressRatingStrategy {
    StressMetrics calculate(Ride ride); // Strategy for motionScore is in RideMotionScore while strategy for AudioScore is in other 3 files, so basically we can switch strategies only for audioScore not motionScore
    String       getName();
}
