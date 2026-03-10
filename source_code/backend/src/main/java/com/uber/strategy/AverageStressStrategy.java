package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.Ride;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AverageStressStrategy implements StressRatingStrategy {

    private static RideMotionScore motionScore;
    public AverageStressStrategy(RideMotionScore motionScore) {
        this.motionScore = motionScore;
    }

    @Override
    public StressMetrics calculate(Ride ride) {
        List<StressSnapshot> snapshots = ride.getStressSnapshots();
        if (snapshots == null || snapshots.isEmpty()) {
            return new StressMetrics(0.0, 0.0);
        }

        double avgAudio = snapshots.stream()
                .mapToDouble(StressSnapshot::getAudioScore)
                .average()
                .orElse(0.0);

        double avgMotion = motionScore.calculate(ride);

        return new StressMetrics(avgAudio, avgMotion);
    }

    @Override
    public String getName() { return "Average Stress Strategy"; }
}
