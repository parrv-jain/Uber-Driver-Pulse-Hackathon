package com.uber.service;

import com.uber.enums.StressRating;
import com.uber.models.Ride;
import com.uber.models.StressMetrics;
import com.uber.strategy.AverageStressStrategy;
import com.uber.strategy.StressRatingStrategy;
import org.springframework.stereotype.Service;

@Service
public class StressRatingService {

    private StressRatingStrategy strategy = new AverageStressStrategy();

    public StressRatingService() {}

    public void rateRide(Ride ride) {
        if (ride.getStressSnapshots().isEmpty()) {
            System.out.println("[StressRatingService] No snapshots for ride " + ride.getId());
        }
        StressMetrics res = strategy.calculate(ride.getStressSnapshots());
        double audioScore = res.getAudioScore();
        double motionScore = res.getMotionScore();
        double score = (audioScore + motionScore) / 2;
        ride.setStressScore(score);
        ride.setMotionScore(motionScore);
        ride.setAudioScore(score);
        System.out.printf("[StressRatingService] Ride %s rated %s using [%s]%n",
                ride.getId(), StressRating.fromScore(score), strategy.getName());
    }

    public void setStrategy(StressRatingStrategy strategy) {
        System.out.println("[StressRatingService] Strategy switched to: " + strategy.getName());
        this.strategy = strategy;
    }

    public StressRatingStrategy getStrategy() {
        return strategy;
    }
}