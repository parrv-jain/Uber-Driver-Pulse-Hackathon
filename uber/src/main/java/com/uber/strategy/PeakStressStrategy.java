package com.uber.strategy;

import com.uber.enums.StressRating;
import com.uber.models.StressMetrics;
import com.uber.models.StressSnapshot;
import java.util.List;

public class PeakStressStrategy implements StressRatingStrategy {

    @Override
    public StressMetrics calculate(List<StressSnapshot> snapshots) {

        double maxAudio = snapshots.stream()
                .mapToDouble(StressSnapshot::getAudioScore)
                .max()
                .orElse(0.0);

        double maxMotion = snapshots.stream()
                .mapToDouble(StressSnapshot::getMotionScore)
                .max()
                .orElse(0.0);

        return new StressMetrics(maxAudio, maxMotion);
    }

    @Override
    public String getName() { return "Peak Stress Strategy"; }
}
