package com.uber.service;

import com.uber.models.*;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SensorSimulator {

    private final Random random = new Random();

    private static final double BASE_LAT = 28.6139;
    private static final double BASE_LNG = 77.2090;

    public SensorReading generateReading(String rideId) {
        return new SensorReading(rideId, generateAudio(), generateMotion());
    }

    private AudioData generateAudio() {
        double decibels         = 30 + random.nextDouble() * 70;
        double sustainedSeconds = random.nextDouble() * 20;
        return new AudioData(decibels, sustainedSeconds);
    }

    private MotionData generateMotion() {
        double speed = 10 + random.nextDouble() * 100;
        double acc_x = 0.0 + (3.0 * random.nextGaussian()); // clamp to [-8, 8]
        double acc_y = 0.0 + (3.0 * random.nextGaussian()); // clamp to [-9, 9]
        double acc_z = 9.8 + (0.05 * random.nextGaussian()); // clamp to [9.7, 9.9]
        acc_x = Math.max(-8.0, Math.min(8.0, acc_x));
        acc_y = Math.max(-9.0, Math.min(9.0, acc_y));
        acc_z = Math.max(9.7,  Math.min(9.9, acc_z));
        double lat   = BASE_LAT + (random.nextDouble() - 0.5) * 0.1;
        double lng   = BASE_LNG + (random.nextDouble() - 0.5) * 0.1;
        return new MotionData(acc_x, acc_y, acc_z, speed, lat, lng);
    }
}