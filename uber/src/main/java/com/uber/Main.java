package com.uber;

import com.uber.enums.RideStatus;
import com.uber.models.*;
import com.uber.repository.*;
import com.uber.service.*;
import com.uber.strategy.*;
import com.uber.service.RideRequestGenerator;

import java.time.LocalTime;
import java.util.List;

public class Main {

    public static void main(String[] args) {

        DriverRepository      driverRepo      = new DriverRepository();
        RideRepository        rideRepo        = new RideRepository();
        RideRequestRepository rideRequestRepo = new RideRequestRepository();

        ShiftService           shiftService     = new ShiftService(driverRepo);
        RideService            rideService      = new RideService(rideRepo, rideRequestRepo, driverRepo);
        SensorSimulator        simulator        = new SensorSimulator();
        StressScoreService     scoreService     = new StressScoreService();
        StressRatingService    ratingService    = new StressRatingService(new AverageStressStrategy());
        EarningVelocityService velocityService  = new EarningVelocityService();


        Driver driver = new Driver("Rahul Verma");
        driver.setEarningGoal(new EarningGoal(1000.0));  // ₹1000 target
        driverRepo.save(driver);
        LocalTime shiftEnd = LocalTime.now().plusHours(8);
        shiftService.startShift(driver, shiftEnd);
        System.out.println("\n=== DRIVER REGISTERED AND SHIFT STARTED SIMULTANEOUSLY ===");
        System.out.println(driver);

        List<RideRequest> generatedRides = RideRequestGenerator.generate();
        generatedRides.forEach(rideRequestRepo::add);

        System.out.println("\n=== AVAILABLE RIDES ===");
        if (driver.hasOngoingRide()) {
            System.out.println("You are already on an active ride. " +
                    "Complete your current trip before viewing new rides.");
        } else {
            List<RideRequest> available = rideRequestRepo.getAll();
            System.out.printf("  %d rides available near you:%n", available.size());
            for (int i = 0; i < available.size(); i++) {
                System.out.printf("  %d. %s%n", i + 1, available.get(i));
            }
        }

        RideRequest req1 = rideRequestRepo.getAll().get(0);
        RideRequest req2 = rideRequestRepo.getAll().get(1);
        RideRequest req3 = rideRequestRepo.getAll().get(2);

        System.out.println("\n=== RIDE 1: SUGGEST & ACCEPT ===");
        Ride ride1 = rideService.acceptRide(driver, req1);

        System.out.println("\n=== RIDE 1: SENSOR SIMULATION ===");
        int estimatedMinutes = req1.getEstimatedDuration();
        List<SensorReading> readings1 = simulator.simulateFullRide(ride1, estimatedMinutes);
        readings1.forEach(ride1::addSensorReading);

        List<StressSnapshot> snapshots1 = scoreService.processAllReadings(readings1);
        snapshots1.forEach(ride1::addStressSnapshot);
        System.out.println("Snapshots generated: " + snapshots1.size());
        snapshots1.forEach(s -> System.out.printf(
                "  t=%s | audio=%.1f | motion=%.1f | combined=%.1f (%s)%n",
                s.getTimestamp().toLocalTime(), s.getAudioScore(),
                s.getMotionScore(), s.getCombinedScore(), s.getLabel()
        ));

        // ── 8. COMPLETE RIDE 1, RATE STRESS, UPDATE EARNINGS ─────────
        System.out.println("\n=== RIDE 1: COMPLETE ===");
        rideService.completeRide(ride1);
        ratingService.rateRide(ride1);
        driver.getEarningGoal().addEarning(ride1.getActualFare());
        velocityService.calculate(driver, driver.getCurrentShift());

        // ── 9. SUGGEST → REJECT RIDE 2 ───────────────────────────────
        System.out.println("\n=== RIDE 2: SUGGEST & REJECT ===");
        rideService.rejectRide(req2);

        // ── 10. SUGGEST → ACCEPT RIDE 3 with DIFFERENT STRATEGY ──────
        System.out.println("\n=== RIDE 3: SUGGEST, ACCEPT, PEAK STRATEGY ===");
        ratingService.setStrategy(new PeakStressStrategy());
        Ride ride3 = rideService.acceptRide(driver, req3);

        List<SensorReading> readings3  = simulator.simulateFullRide(ride3, req3.getEstimatedDuration());
        readings3.forEach(ride3::addSensorReading);
        List<StressSnapshot> snapshots3 = scoreService.processAllReadings(readings3);
        snapshots3.forEach(ride3::addStressSnapshot);

        rideService.completeRide(ride3);
        ratingService.rateRide(ride3);
        driver.getEarningGoal().addEarning(ride3.getActualFare());
        velocityService.calculate(driver, driver.getCurrentShift());

        // ── 11. FINAL REPORT ──────────────────────────────────────────
        System.out.println("\n=== FINAL REPORT ===");
        System.out.println(driver);
        System.out.println(driver.getEarningGoal());

        System.out.println("\n-- Completed Rides --");
        rideService.getRidesByDriver(driver.getId(), RideStatus.COMPLETED)
                .forEach(r -> System.out.printf("  %s | Stress: %s%n", r, r.getStressRating()));


        // ── 12. END SHIFT ─────────────────────────────────────────────
        System.out.println("\n=== END SHIFT ===");
        shiftService.endShift(driver);
        System.out.println("Goal met: " + driver.getEarningGoal().isGoalMet());
    }
}
