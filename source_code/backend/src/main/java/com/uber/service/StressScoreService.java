package com.uber.service;

import com.uber.enums.AudioRating;
import com.uber.enums.MotionRating;
import com.uber.models.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StressScoreService {

    // Can be changed to give more priority to audio or motion in combined rating
    private static final double AUDIO_WEIGHT  = 0.5;
    private static final double MOTION_WEIGHT = 0.5;

    private final EarningVelocityService earningVelocityService;
    private final CsvLogger csvLogger;

    public StressScoreService(EarningVelocityService earningVelocityService, CsvLogger csvLogger) {
        this.earningVelocityService = earningVelocityService;
        this.csvLogger = csvLogger;
    }

    public double calcAudioScore(AudioData audio) {
        double dbScore   = (audio.getDecibels() - 30.0) / 85.0;
        double timeScore = Math.log(audio.getSustainedSeconds());
        double raw       = (dbScore) + (0.1 * timeScore);
        return Math.min(1.0, Math.max(0.0, raw));
    }

    public AudioRating classifyAudio(double audioScore) {
        return AudioRating.from(audioScore);
    }

    public double calcMotionScore(MotionData motion) {
        // acc_z ignored (constant gravity ~9.8)
        double acc_x = motion.getAcc_x();
        double acc_y = motion.getAcc_y();

        // HA - Harsh Acceleration, HB - Harsh Braking
        final double HB_SMOOTH_THRESHOLD = 3.0; // 0.3 G
        final double HB_ROUGH_THRESHOLD  = 6.0; // 0.61 G
        final double HA_SMOOTH_THRESHOLD = 2.0; // 0.20 G
        final double HA_ROUGH_THRESHOLD  = 4.2; // 0.43 G

        // Positive acc → Harsh Acceleration (HA), Negative → Harsh Braking (HB)
        double score_x = calcAxisScore(acc_x,
                acc_x >= 0 ? HA_SMOOTH_THRESHOLD : HB_SMOOTH_THRESHOLD,
                acc_x >= 0 ? HA_ROUGH_THRESHOLD  : HB_ROUGH_THRESHOLD);

        double score_y = calcAxisScore(acc_y,
                acc_y >= 0 ? HA_SMOOTH_THRESHOLD : HB_SMOOTH_THRESHOLD,
                acc_y >= 0 ? HA_ROUGH_THRESHOLD  : HB_ROUGH_THRESHOLD);

        return Math.max(score_y, score_x);
    }

    /**
     * Normalises |acc| into [0.0, 1.0] between the two thresholds.
     *   0.0  → at or below smoothThreshold  (no event)
     *   1.0  → at or above roughThreshold   (maximum severity)
     */
    private double calcAxisScore(double acc, double smoothThreshold, double roughThreshold) {
        double magnitude = Math.abs(acc);
        if (magnitude <= smoothThreshold) return 0.0;
        if (magnitude >= roughThreshold)  return 1.0;
        return (magnitude - smoothThreshold) / (roughThreshold - smoothThreshold);
    }

    public MotionRating classifyMotion(double motionScore) {
        return MotionRating.from(motionScore);
    }

    public double calcCombined(double audioScore, double motionScore) {
        return (AUDIO_WEIGHT * audioScore) + (MOTION_WEIGHT * motionScore);
    }

    public StressSnapshot takeSnapshot(SensorReading reading, Driver driver, Shift shift, Ride ride) {
        double audio    = calcAudioScore(reading.getAudioData());
        double motion   = calcMotionScore(reading.getMotionData());
        double combined = calcCombined(audio, motion);
        EarningVelocity ev = earningVelocityService.calculate(driver, shift, reading.getTimestamp());
        StressSnapshot snapshot = new StressSnapshot(reading.getTimestamp(), audio, motion, combined, ev);
        csvLogger.logAudioReading(reading, snapshot, driver.getId());
        csvLogger.logMotionReading(reading, snapshot, driver.getId());
        csvLogger.logFlaggedMoment(snapshot, reading, ride);
        return snapshot;
    }
}