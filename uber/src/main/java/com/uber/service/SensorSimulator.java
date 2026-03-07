package com.uber.service;

import com.uber.models.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class SensorSimulator {

    private final Random random = new Random();

    // Base coordinates — simulates movement around a city area
    private static final double BASE_LAT = 28.6139;
    private static final double BASE_LNG = 77.2090;

    public SensorReading generateReading(String rideId) {
        return new SensorReading(rideId, generateAudio(), generateMotion());
    }

    // Simulates one reading per 2 minute for the estimated duration of the ride
    public List<SensorReading> simulateFullRide(Ride ride, int minutes) {
        List<SensorReading> readings = new ArrayList<>();
        for (int i = 0; i < minutes; i += 2) {
            readings.add(generateReading(ride.getId()));
        }
        return readings;
    }

    private AudioData generateAudio() {
        double  decibels  = 40 + random.nextDouble() * 70;  // 40–110 dB
        double  sustainedSeconds = random.nextDouble() * 20; // 0-20 s
        return new AudioData(decibels, sustainedSeconds);
    }

    private MotionData generateMotion() {
        double speed = 10 + random.nextDouble() * 100; // 10–110 km/h
        double acc_x = random.nextDouble() * 8;        // 0–8 m/s²
        double acc_y = random.nextDouble() * 8;        // 0–8 m/s²
        double acc_z = random.nextDouble() * 8;        // 0–8 m/s²
        double lat = BASE_LAT + (random.nextDouble() - 0.5) * 0.1; // Latitude and Longitude are completely random and not used later
        double lng = BASE_LNG + (random.nextDouble() - 0.5) * 0.1;
        return new MotionData(speed, acc_x, acc_y, acc_z, lat, lng);
    }
}
