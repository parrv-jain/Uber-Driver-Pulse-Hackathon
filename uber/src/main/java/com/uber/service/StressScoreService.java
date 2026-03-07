package com.uber.service;

import com.uber.enums.AudioRating;
import com.uber.enums.MotionRating;
import com.uber.models.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StressScoreService {

    private static final double AUDIO_WEIGHT  = 0.4;
    private static final double MOTION_WEIGHT = 0.6;

    private final EarningVelocityService earningVelocityService;
    private final CsvLogger csvLogger;

    public StressScoreService(EarningVelocityService earningVelocityService, CsvLogger csvLogger) {
        this.earningVelocityService = earningVelocityService;
        this.csvLogger = csvLogger;
    }

    public double calcAudioScore(AudioData audio) {
        double dbScore   = (audio.getDecibels() - 30.0) / 90.0;
        double timeScore = (audio.getSustainedSeconds() - 2.0) / 58.0;
        double raw       = (0.65 * dbScore) + (0.35 * timeScore);
        return Math.min(1.0, Math.max(0.0, raw));
    }

    public AudioRating classifyAudio(double audioScore) {
        return AudioRating.from(audioScore);
    }

    public double calcMotionScore(MotionData motion) {
        // acc_z ignored (constant gravity ~9.8)
        double latAcceleration = motion.getAcceleration();
        final double SMOOTH_THRESHOLD = 2.0;
        final double ROUGH_THRESHOLD  = 8.0;

        double score = (latAcceleration - SMOOTH_THRESHOLD)
                / (ROUGH_THRESHOLD - SMOOTH_THRESHOLD);

        return Math.max(0.0, Math.min(1.0, score));
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

    public List<StressSnapshot> processAllReadings(List<SensorReading> readings,
                                                   Driver driver, Shift shift, Ride ride) {
        List<StressSnapshot> snapshots = new ArrayList<>();
        for (SensorReading reading : readings) {
            snapshots.add(takeSnapshot(reading, driver, shift, ride));
        }
        return snapshots;
    }
}