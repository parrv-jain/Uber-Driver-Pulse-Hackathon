package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.StressSnapshot;
import java.util.List;

public class AverageStressStrategy implements StressRatingStrategy {

    @Override
    public double calculate(List<StressSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) return 0.0;
        double avg = snapshots.stream()
                .mapToDouble(StressSnapshot::getCombinedScore)
                .average()
                .orElse(0.0);
        return avg;
    }

    @Override
    public String getName() { return "Average Stress Strategy"; }
}
