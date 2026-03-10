package com.uber.models;

public class StressMetrics {

    private final double audioScore;
    private final double motionScore;

    public StressMetrics(double audioScore, double motionScore) {
        this.audioScore = audioScore;
        this.motionScore = motionScore;
    }

    public double getAudioScore() {
        return audioScore;
    }

    public double getMotionScore() {
        return motionScore;
    }

    @Override
    public String toString() {
        return "StressMetrics[audio=" + audioScore + ", motion=" + motionScore + "]";
    }
}