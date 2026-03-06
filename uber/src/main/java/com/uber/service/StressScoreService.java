package com.uber.service;

import com.uber.models.*;
import java.util.ArrayList;
import java.util.List;

public class StressScoreService {

    // Audio weight : Motion weight in combined score
    private static final double AUDIO_WEIGHT  = 0.4;
    private static final double MOTION_WEIGHT = 0.6;

    // Normalize decibels (assumed range 30–120 dB) to 0–100
    public double calcAudioScore(AudioData audio) {
        double normalized = Math.min(100, Math.max(0, (audio.getDecibels() - 30) / 90.0 * 100));
//        if (audio.isSpiking()) {
//            normalized = Math.min(100, normalized * 1.3); // 30% spike penalty
//        }
        return normalized;
    }

    // Speed contributes 40% of motion score, acceleration 60%
    public double calcMotionScore(MotionData motion) {
        double speedScore = Math.min(100, (motion.getSpeed() / 120.0) * 40);
        double accelScore = Math.min(100, (motion.getAcceleration() / 6.0) * 60);
        return Math.min(100, speedScore + accelScore);
    }

    public double calcCombined(double audioScore, double motionScore) {
        return (AUDIO_WEIGHT * audioScore) + (MOTION_WEIGHT * motionScore);
    }

    // Produces a StressSnapshot from a single SensorReading
    public StressSnapshot takeSnapshot(SensorReading reading) {
        double audio = calcAudioScore(reading.getAudioData());
        double motion = calcMotionScore(reading.getMotionData());
        double combined = calcCombined(audio, motion);
        return new StressSnapshot(reading.getTimestamp(), audio, motion, combined);
    }

    // Processes every reading in a list → list of snapshots
    public List<StressSnapshot> processAllReadings(List<SensorReading> readings) {
        List<StressSnapshot> snapshots = new ArrayList<>();
        for (SensorReading reading : readings) {
            snapshots.add(takeSnapshot(reading));
        }
        return snapshots;
    }
}
