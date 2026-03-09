package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.StressSnapshot;
import java.util.List;

public class PeakStressStrategy implements StressRatingStrategy {

    @Override
    public double calculate(List<StressSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) return 0.0;
        double peak = snapshots.stream()
                .mapToDouble(StressSnapshot::getCombinedScore)
                .max()
                .orElse(0.0);
        return peak;
    }

    @Override
    public String getName() { return "Peak Stress Strategy"; }
}
