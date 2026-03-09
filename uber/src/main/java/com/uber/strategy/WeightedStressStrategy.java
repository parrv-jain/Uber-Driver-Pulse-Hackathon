package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.StressSnapshot;
import java.util.List;

public class WeightedStressStrategy implements StressRatingStrategy {

    private static final double RECENT_WEIGHT = 1.5;
    private static final double OLDER_WEIGHT  = 1.0;

    // The last 1/3 of snapshots are considered "recent"
    @Override
    public double calculate(List<StressSnapshot> snapshots) {
        if (snapshots == null || snapshots.isEmpty()) return 0.0;

        int size = snapshots.size();
        int recentCutoff = size - Math.max(1, size / 3);
        double totalWeight  = 0.0;
        double weightedSum  = 0.0;

        for (int i = 0; i < size; i++) {
            double weight = (i >= recentCutoff) ? RECENT_WEIGHT : OLDER_WEIGHT;
            weightedSum  += snapshots.get(i).getCombinedScore() * weight;
            totalWeight  += weight;
        }

        double weightedAvg = weightedSum / totalWeight;
        return weightedAvg;
    }

    @Override
    public String getName() { return "Weighted Stress Strategy"; }
}
