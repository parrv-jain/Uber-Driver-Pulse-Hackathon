package com.uber.service;

import com.uber.models.*;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.*;

@Service
public class RideSimulationScheduler {

    private static final int INTERVAL_SECONDS = 30;

    private final SensorSimulator        simulator;
    private final StressScoreService     scoreService;
    private final ScheduledExecutorService executor = Executors.newScheduledThreadPool(4);

    // rideId → its running task, so we can cancel it on completion
    private final Map<String, ScheduledFuture<?>> activeTasks = new ConcurrentHashMap<>();

    public RideSimulationScheduler(SensorSimulator simulator, StressScoreService scoreService) {
        this.simulator    = simulator;
        this.scoreService = scoreService;
    }

    public void startSimulation(Ride ride, Driver driver, Shift shift) {
        ScheduledFuture<?> task = executor.scheduleAtFixedRate(() -> {
            try {
                SensorReading  reading  = simulator.generateReading(ride.getId());
                StressSnapshot snapshot = scoreService.takeSnapshot(reading, driver, shift, ride);
                ride.addSensorReading(reading);
                ride.addStressSnapshot(snapshot);
                System.out.printf("[Scheduler] Ride %s | t=%s | combined=%.2f (%s)%n",
                        ride.getId(),
                        snapshot.getTimestamp().toLocalTime(),
                        snapshot.getCombinedScore(),
                        snapshot.getCombinedLevel());
            } catch (Exception e) {
                System.err.println("[Scheduler] Error during simulation: " + e.getMessage());
            }
        }, 0, INTERVAL_SECONDS, TimeUnit.SECONDS);

        activeTasks.put(ride.getId(), task);
        System.out.println("[Scheduler] Started simulation for ride " + ride.getId());
    }

    public void stopSimulation(String rideId) {
        ScheduledFuture<?> task = activeTasks.remove(rideId);
        if (task != null) {
            task.cancel(false); // false = let current execution finish if running
            System.out.println("[Scheduler] Stopped simulation for ride " + rideId);
        }
    }
}