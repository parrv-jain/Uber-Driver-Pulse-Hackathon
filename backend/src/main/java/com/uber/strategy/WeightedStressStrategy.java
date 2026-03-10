package com.uber.strategy;

import com.uber.models.Ride;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WeightedStressStrategy implements StressRatingStrategy {

    private static final double RECENT_WEIGHT = 1.5;
    private static final double OLDER_WEIGHT  = 1.0;

    private static RideMotionScore motionScore;
    public WeightedStressStrategy(RideMotionScore motionScore) {
        this.motionScore = motionScore;
    }
    // The last 1/3 of snapshots are considered "recent"
    @Override
    public StressMetrics calculate(Ride ride) {
        List<StressSnapshot> snapshots = ride.getStressSnapshots();
        if (snapshots == null || snapshots.isEmpty()) {
            return new StressMetrics(0.0, 0.0);
        }

        int size = snapshots.size();
        int recentCutoff = size - Math.max(1, size / 3);

        double totalWeight = 0.0;

        double weightedAudioSum = 0.0;
//        double weightedMotionSum = 0.0;

        for (int i = 0; i < size; i++) {

            double weight = (i >= recentCutoff) ? RECENT_WEIGHT : OLDER_WEIGHT;

            StressSnapshot snapshot = snapshots.get(i);

            weightedAudioSum  += snapshot.getAudioScore() * weight;
//            weightedMotionSum += snapshot.getMotionScore() * weight;

            totalWeight += weight;
        }

        double weightedAudio  = weightedAudioSum / totalWeight;
        double weightedMotion = motionScore.calculate(ride);

        return new StressMetrics(weightedAudio, weightedMotion);
    }

    @Override
    public String getName() {
        return "Weighted Stress Strategy";
    }
}