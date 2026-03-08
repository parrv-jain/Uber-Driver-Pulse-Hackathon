package com.uber.controller;

import com.uber.enums.RideStatus;
import com.uber.models.*;
import com.uber.repository.DriverRepository;
import com.uber.repository.RideRepository;
import com.uber.repository.RideRequestRepository;
import com.uber.service.*;
import com.uber.strategy.AverageStressStrategy;
import com.uber.strategy.PeakStressStrategy;
import com.uber.strategy.WeightedStressStrategy;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller — exposes all the LLD logic as HTTP endpoints.
 *
 * Quick reference:
 *   POST   /api/driver/register          → register a driver + start shift
 *   GET    /api/rides/available           → list available ride requests
 *   POST   /api/rides/generate            → generate new ride requests
 *   POST   /api/rides/accept              → accept a ride
 *   POST   /api/rides/reject              → reject a ride
 *   POST   /api/rides/{rideId}/complete   → complete a ride
 *   GET    /api/rides/{rideId}/stress     → get stress snapshots for a ride
 *   POST   /api/rides/{rideId}/strategy   → switch stress strategy
 *   GET    /api/driver/{driverId}/report  → final report for driver
 *   POST   /api/shift/end                 → end shift for driver
 */

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // allows any frontend (React, etc.) to call this API
public class DriverController {

    private final DriverRepository      driverRepo;
    private final RideRepository        rideRepo;
    private final RideRequestRepository rideRequestRepo;
    private final ShiftService          shiftService;
    private final RideService           rideService;
    private final SensorSimulator       simulator;
    private final StressRatingService   ratingService;
    private final StressScoreService    scoreService;
    private final EarningVelocityService velocityService;
    private final RideSimulationScheduler scheduler;

    public DriverController(DriverRepository driverRepo,
                            RideRepository rideRepo,
                            RideRequestRepository rideRequestRepo,
                            ShiftService shiftService,
                            RideService rideService,
                            SensorSimulator simulator,
                            StressRatingService ratingService,
                            StressScoreService scoreService,
                            EarningVelocityService velocityService,
                            RideSimulationScheduler scheduler) {
        this.driverRepo      = driverRepo;
        this.rideRepo        = rideRepo;
        this.rideRequestRepo = rideRequestRepo;
        this.shiftService    = shiftService;
        this.rideService     = rideService;
        this.simulator       = simulator;
        this.ratingService   = ratingService;
        this.scoreService    = scoreService;
        this.velocityService = velocityService;
        this.scheduler   = scheduler;
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/driver/register
    // Body: { "name": "Rahul Verma", "earningGoal": 1000, "shiftHours": 8 }
    // Returns: driver object
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/driver/register")
    public ResponseEntity<?> registerDriver(@RequestBody Map<String, Object> body) {
        String name        = (String) body.get("name");
        double earningGoal = ((Number) body.get("earningGoal")).doubleValue();
        int    shiftHours  = ((Number) body.getOrDefault("shiftHours", 8)).intValue();

        Driver driver = new Driver(name);
        driver.setEarningGoal(new EarningGoal(earningGoal));
        driverRepo.save(driver);

        LocalTime shiftEnd = LocalTime.now().plusHours(shiftHours);
        shiftService.startShift(driver, shiftEnd);

        return ResponseEntity.ok(Map.of(
                "driverId",    driver.getId(),
                "name",        driver.getName(),
                "earningGoal", earningGoal,
                "shiftEnd",    shiftEnd.toString(),
                "message",     "Driver registered and shift started"
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/generate
    // Body: { "driverId": "abc123" }  (optional — just triggers generation)
    // Returns: list of generated ride requests
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/rides/generate")
    public ResponseEntity<?> generateRides() {
        List<RideRequest> requests = RideRequestGenerator.generate();
        requests.forEach(rideRequestRepo::add);
        return ResponseEntity.ok(Map.of(
                "count",   requests.size(),
                "message", "Ride requests generated",
                "rides",   requests.stream().map(this::requestSummary).toList()
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET /api/rides/available
    // Returns: list of pending ride requests
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/rides/available")
    public ResponseEntity<?> getAvailableRides() {
        List<RideRequest> available = rideRequestRepo.getAll();
        return ResponseEntity.ok(Map.of(
                "count", available.size(),
                "rides", available.stream().map(this::requestSummary).toList()
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/accept
    // Body: { "driverId": "abc123", "requestId": "xyz456" }
    // Returns: ride summary with stress snapshots
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/rides/accept")
    public ResponseEntity<?> acceptRide(@RequestBody Map<String, String> body) {
        String driverId   = body.get("driverId");
        String requestId  = body.get("requestId");

        Driver driver = driverRepo.findById(driverId);
        if (driver == null) return ResponseEntity.badRequest().body("Driver not found: " + driverId);

        Optional<RideRequest> reqOpt = rideRequestRepo.findById(requestId);
        if (reqOpt.isEmpty()) return ResponseEntity.badRequest().body("Ride request not found: " + requestId);

        RideRequest request = reqOpt.get();
        Ride ride = rideService.acceptRide(driver, request);

        // Simulate sensors + process stress (same as Main.java did)
        scheduler.startSimulation(ride, driver, driver.getCurrentShift());

        return ResponseEntity.ok(Map.of(
                "rideId",        ride.getId(),
                "from",          request.getPickupLocation().getLabel(),
                "to",            request.getDropLocation().getLabel(),
                "fare",          ride.getActualFare(),
                "message",       "Ride accepted and sensor data simulated"
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/reject
    // Body: { "requestId": "xyz456" }
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/rides/reject")
    public ResponseEntity<?> rejectRide(@RequestBody Map<String, String> body) {
        String requestId = body.get("requestId");
        Optional<RideRequest> reqOpt = rideRequestRepo.findById(requestId);
        if (reqOpt.isEmpty()) return ResponseEntity.badRequest().body("Ride request not found: " + requestId);

        rideService.rejectRide(reqOpt.get());
        return ResponseEntity.ok(Map.of("message", "Ride request rejected", "requestId", requestId));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/{rideId}/complete
    // Returns: final ride summary with stress rating
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/rides/{rideId}/complete")
    public ResponseEntity<?> completeRide(@PathVariable String rideId) {
        Ride ride = rideRepo.findById(rideId);
        if (ride == null) return ResponseEntity.badRequest().body("Ride not found: " + rideId);

        scheduler.stopSimulation(rideId);
        ratingService.rateRide(ride);
        rideService.completeRide(ride);

        Driver driver = ride.getDriver();
        velocityService.calculate(driver, driver.getCurrentShift(), LocalDateTime.now());

        return ResponseEntity.ok(Map.of(
                "rideId",       ride.getId(),
                "status",       ride.getStatus(),
                "fare",         ride.getActualFare(),
                "stressRating", ride.getStressRating() != null ? ride.getStressRating().toString() : "N/A",
                "audioFlags",   ride.getAudioFlagCount(),
                "motionFlags",  ride.getMotionFlagCount(),
                "totalFlags",   ride.getTotalFlagCount()
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET /api/rides/{rideId}/stress
    // Returns: all stress snapshots for a ride
    // ALSO USED TO GET LIVE EARNING VELOCITY
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/rides/{rideId}/stress")
    public ResponseEntity<?> getStressSnapshots(@PathVariable String rideId) {
        Ride ride = rideRepo.findById(rideId);
        if (ride == null) return ResponseEntity.badRequest().body("Ride not found: " + rideId);

        List<Map<String, Object>> snapshots =
                ride.getStressSnapshots().stream().map(s -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("timestamp", s.getTimestamp().toLocalTime().toString());
                    m.put("audioScore", s.getAudioScore());
                    m.put("audioLevel", s.getAudioLevel().toString());
                    m.put("motionScore", s.getMotionScore());
                    m.put("motionLevel", s.getMotionLevel().toString());
                    m.put("combinedScore", s.getCombinedScore());
                    m.put("combinedLevel", s.getCombinedLevel().toString());
                    m.put("audioFlagged", s.isAudioFlagged());
                    m.put("motionFlagged", s.isMotionFlagged());
                    m.put("currentVelocity", s.getEarningVelocity().getCurrentVelocity());
                    m.put("requiredVelocity", s.getEarningVelocity().getRequiredVelocity());
                    m.put("velocityDelta", s.getEarningVelocity().getVelocityDelta());
                    m.put("paceStatus", s.getEarningVelocity().getPaceStatus());
                    return m;
                }).toList();

        return ResponseEntity.ok(Map.of("rideId", rideId, "snapshots", snapshots));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/{rideId}/strategy
    // Body: { "strategy": "AVERAGE" | "PEAK" | "WEIGHTED" }
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/rides/{rideId}/strategy")
    public ResponseEntity<?> switchStrategy(@PathVariable String rideId,
                                            @RequestBody Map<String, String> body) {
        String strategyName = body.getOrDefault("strategy", "AVERAGE").toUpperCase();
        switch (strategyName) {
            case "PEAK"     -> ratingService.setStrategy(new PeakStressStrategy());
            case "WEIGHTED" -> ratingService.setStrategy(new WeightedStressStrategy());
            default         -> ratingService.setStrategy(new AverageStressStrategy());
        }
        return ResponseEntity.ok(Map.of("message", "Strategy switched to " + strategyName));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET /api/driver/{driverId}/report
    // Returns: full driver report (same as the "FINAL REPORT" in Main.java)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/driver/{driverId}/report")
    public ResponseEntity<?> getDriverReport(@PathVariable String driverId) {
        Driver driver = driverRepo.findById(driverId);
        if (driver == null) return ResponseEntity.badRequest().body("Driver not found: " + driverId);

        EarningGoal goal = driver.getEarningGoal();
        List<Map<String, Object>> completedRides = rideService
                .getRidesByDriver(driverId, RideStatus.COMPLETED)
                .stream().map(r -> Map.<String, Object>of(
                        "rideId",       r.getId(),
                        "fare",         r.getActualFare(),
                        "stressRating", r.getStressRating() != null ? r.getStressRating().toString() : "N/A"
                )).toList();

        return ResponseEntity.ok(Map.of(
                "driverId",       driver.getId(),
                "name",           driver.getName(),
                "targetAmount",   goal.getTargetAmount(),
                "currentEarned",  goal.getCurrentEarned(),
                "remaining",      goal.getRemainingTarget(),
                "goalMet",        goal.isGoalMet(),
                "completedRides", completedRides
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/shift/end
    // Body: { "driverId": "abc123" }
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/shift/end")
    public ResponseEntity<?> endShift(@RequestBody Map<String, String> body) {
        String driverId = body.get("driverId");
        Driver driver = driverRepo.findById(driverId);
        if (driver == null) return ResponseEntity.badRequest().body("Driver not found: " + driverId);

        shiftService.endShift(driver);
        return ResponseEntity.ok(Map.of(
                "message",     "Shift ended",
                "hoursWorked", driver.getCurrentShift().getHoursWorked(),
                "goalMet",     driver.getEarningGoal().isGoalMet()
        ));
    }

    // ── Helper: converts a RideRequest to a simple map for JSON response ──
    private Map<String, Object> requestSummary(RideRequest r) {
        return Map.of(
                "requestId", r.getId(),
                "from",      r.getPickupLocation().getLabel(),
                "to",        r.getDropLocation().getLabel(),
                "fare",      r.getEstimatedFare(),
                "distanceKm",r.getEstimatedDistance(),
                "durationMin",r.getEstimatedDuration()
        );
    }
}