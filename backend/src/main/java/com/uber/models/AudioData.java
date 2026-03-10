package com.uber.models;

public final class AudioData {

    private final double decibels;    // 30–120 dB range
    private final double sustainedSeconds;   // 2 - 60seconds

    public AudioData(double decibels, double sustainedSeconds) {
        this.decibels  = decibels;
        this.sustainedSeconds = sustainedSeconds; // generate btwn 2 to 60 sec
    }

    public double  getDecibels()  { return decibels; }
    public double  getSustainedSeconds() { return sustainedSeconds; }

    @Override
    public String toString() {
        return String.format("Audio[%.1f dB, %.2f s]", decibels, sustainedSeconds);
    }
}
