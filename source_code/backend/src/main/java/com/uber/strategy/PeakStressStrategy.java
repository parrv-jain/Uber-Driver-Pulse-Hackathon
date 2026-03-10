package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.Ride;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeakStressStrategy implements StressRatingStrategy {

    private static RideMotionScore motionScore;
    public PeakStressStrategy(RideMotionScore motionScore) {
        this.motionScore = motionScore;
    }

    @Override
    public StressMetrics calculate(Ride ride) {
        List<StressSnapshot> snapshots = ride.getStressSnapshots();
        double maxAudio = snapshots.stream()
                .mapToDouble(StressSnapshot::getAudioScore)
                .max()
                .orElse(0.0);

        double maxMotion = motionScore.calculate(ride);

        return new StressMetrics(maxAudio, maxMotion);
    }

    @Override
    public String getName() { return "Peak Stress Strategy"; }
}
