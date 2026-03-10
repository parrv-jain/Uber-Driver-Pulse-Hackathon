package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import java.util.List;

public class AverageStressStrategy implements StressRatingStrategy {

    @Override
    public StressMetrics calculate(List<StressSnapshot> snapshots) {

        if (snapshots == null || snapshots.isEmpty()) {
            return new StressMetrics(0.0, 0.0);
        }

        double avgAudio = snapshots.stream()
                .mapToDouble(StressSnapshot::getAudioScore)
                .average()
                .orElse(0.0);

        double avgMotion = snapshots.stream()
                .mapToDouble(StressSnapshot::getMotionScore)
                .average()
                .orElse(0.0);

        return new StressMetrics(avgAudio, avgMotion);
    }

    @Override
    public String getName() { return "Average Stress Strategy"; }
}
