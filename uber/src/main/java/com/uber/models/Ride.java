package com.uber.models;

import com.uber.enums.AudioRating;
import com.uber.enums.MotionRating;
import com.uber.enums.RideStatus;
import com.uber.enums.StressRating;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class Ride {

    private final String id;
    private final Driver driver;
    private final RideRequest request;
    private RideStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private double actualFare;
    private double motionScore;
    private double audioScore;
    private double stressScore;
    private final List<SensorReading> sensorReadings;
    private final List<StressSnapshot> stressSnapshots;

    public Ride(Driver driver, RideRequest request) {
        this.id              = UUID.randomUUID().toString().substring(0, 8);
        this.driver          = driver;
        this.request         = request;
        this.status          = RideStatus.ONGOING;
        this.actualFare      = request.getEstimatedFare();
        this.sensorReadings  = new ArrayList<>();
        this.stressSnapshots = new ArrayList<>();
        this.stressScore = 0.0;
        this.motionScore = 0.0;
        this.audioScore = 0.0;
    }

    public void addSensorReading(SensorReading reading) {
        sensorReadings.add(reading);
    }

    public void addStressSnapshot(StressSnapshot snapshot) {
        stressSnapshots.add(snapshot);
    }

    // Duration in minutes — returns 0 if ride not yet completed
    public int getDuration() {
        if (startTime == null || endTime == null) return 0;
        return (int) Duration.between(startTime, endTime).toMinutes();
    }

    public long getAudioFlagCount() {
        return stressSnapshots.stream().filter(StressSnapshot::isAudioFlagged).count();
    }

    public long getMotionFlagCount() {
        return stressSnapshots.stream().filter(StressSnapshot::isMotionFlagged).count();
    }

    public long getTotalFlagCount() {
        return stressSnapshots.stream().filter(StressSnapshot::isTotalFlagged).count();
    }

    public String              getId()              { return id; }
    public Driver              getDriver()          { return driver; }
    public RideRequest         getRequest()         { return request; }
    public RideStatus          getStatus()          { return status; }
    public LocalDateTime       getStartTime()       { return startTime; }
    public LocalDateTime       getEndTime()         { return endTime; }
    public double              getActualFare()      { return actualFare; }
    public StressRating        getStressRating()    { return StressRating.fromScore(stressScore); }
    public MotionRating        getMotionRating()     { return MotionRating.from(motionScore); }
    public double              getAudioScore()       { return audioScore; }
    public AudioRating getAudioRating()     { return AudioRating.from(audioScore); }
    public double getMotionScore()       { return motionScore; }
    public double getStressScore()       { return stressScore; }
    public List<SensorReading> getSensorReadings()  { return Collections.unmodifiableList(sensorReadings); }
    public List<StressSnapshot> getStressSnapshots(){ return Collections.unmodifiableList(stressSnapshots); }

    public void setStatus(RideStatus status)           { this.status = status; }
    public void setStartTime(LocalDateTime startTime)  { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime)      { this.endTime = endTime; }
    public void setActualFare(double actualFare)       { this.actualFare = actualFare; }

    public void setStressScore(double stressScore) { this.stressScore = stressScore; }
    public void setAudioScore(double audioScore) { this.audioScore = audioScore; }
    public void setMotionScore(double motionScore) { this.motionScore = motionScore; }

    @Override
    public String toString() {
        return String.format("Ride[id=%s, driver=%s, status=%s, fare=₹%.2f, stressScore=%s, stressLevel=%s]",
                id, driver.getName(), status, actualFare, stressScore, this.getStressRating());
    }
}
