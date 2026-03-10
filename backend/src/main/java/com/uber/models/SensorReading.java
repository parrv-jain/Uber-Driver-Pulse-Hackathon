package com.uber.models;

import java.time.LocalDateTime;

public class SensorReading {

    private final String        rideId;
    private final LocalDateTime timestamp;
    private final AudioData     audioData;
    private final MotionData    motionData;

    public SensorReading(String rideId, AudioData audioData, MotionData motionData) {
        this.rideId     = rideId;
        this.timestamp  = LocalDateTime.now();
        this.audioData  = audioData;
        this.motionData = motionData;
    }

    public String        getRideId()    { return rideId; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public AudioData     getAudioData() { return audioData; }
    public MotionData    getMotionData(){ return motionData; }

    @Override
    public String toString() {
        return String.format("SensorReading[rideId=%s, time=%s, %s, %s]",
                rideId, timestamp, audioData, motionData);
    }
}
