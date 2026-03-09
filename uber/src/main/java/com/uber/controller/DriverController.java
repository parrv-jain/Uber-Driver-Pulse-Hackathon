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
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.*;
import java.util.stream.Collectors;

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
 *
 *   ── ADMIN ENDPOINTS ──
 *   GET    /api/admin/dashboard           → summary stats for Uber admin
 *   GET    /api/admin/rides               → all rides (ongoing + completed)
 *   GET    /api/admin/flagged-moments     → all flagged moments from CSV
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

    private static final String FLAGGED_LOG = "uber/log/flagged_moments.csv";

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
        this.scheduler       = scheduler;
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

        LocalDateTime shiftEnd = LocalDateTime.now().plusHours(shiftHours);
        shiftService.startShift(driver, shiftEnd);

        driver.setEarningGoal(new EarningGoal(earningGoal));
        driver.getEarningGoal().setEarningVelocity(velocityService.calculate(driver, driver.getCurrentShift(), LocalDateTime.now()));

        return ResponseEntity.ok(Map.of(
                "driverId",    driver.getId(),
                "name",        driver.getName(),
                "earningGoal", earningGoal,
                "hoursRemaining", String.format("%.2f", driver.getCurrentShift().getHoursRemaining()),
                "shiftEnd", driver.getCurrentShift().getEndTime().toLocalTime().format(DateTimeFormatter.ofPattern("HH:mm")),
                "message",     "Driver registered and shift started"
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // POST /api/rides/generate
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
                "completedRides", completedRides,
                "currentEarningVelocity", goal.getEarningVelocity().getCurrentVelocity(),
                "requiredEarningVelocity", goal.getEarningVelocity().getRequiredVelocity(),
                "paceStatus", goal.getEarningVelocity().getPaceStatus()
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

    // ═════════════════════════════════════════════════════════════════
    //  ADMIN ENDPOINTS — Uber's perspective
    // ═════════════════════════════════════════════════════════════════

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/dashboard
    // Returns: summary stats — total rides, ongoing, completed, flags
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/admin/dashboard")
    public ResponseEntity<?> getAdminDashboard() {
        List<Ride> allRides = rideRepo.findAll();

        long totalRides     = allRides.size();
        long ongoingRides   = allRides.stream().filter(r -> r.getStatus() == RideStatus.ONGOING).count();
        long completedRides = allRides.stream().filter(r -> r.getStatus() == RideStatus.COMPLETED).count();
        long totalFlags     = allRides.stream().mapToLong(Ride::getTotalFlagCount).sum();
        long highStressRides = allRides.stream()
                .filter(r -> r.getStressRating() != null && r.getStressRating().toString().contains("HIGH"))
                .count();
        double totalRevenue = allRides.stream()
                .filter(r -> r.getStatus() == RideStatus.COMPLETED)
                .mapToDouble(Ride::getActualFare).sum();

        return ResponseEntity.ok(Map.of(
                "totalRides",      totalRides,
                "ongoingRides",    ongoingRides,
                "completedRides",  completedRides,
                "totalFlags",      totalFlags,
                "highStressRides", highStressRides,
                "totalRevenue",    totalRevenue
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/rides
    // Returns: all rides (ONGOING + COMPLETED) with full details
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/admin/rides")
    public ResponseEntity<?> getAllRides() {
        List<Ride> allRides = rideRepo.findAll();

        List<Map<String, Object>> rideList = allRides.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("rideId",       r.getId());
            map.put("driverId",     r.getDriver().getId());
            map.put("driverName",   r.getDriver().getName());
            map.put("from",         r.getRequest().getPickupLocation().getLabel());
            map.put("to",           r.getRequest().getDropLocation().getLabel());
            map.put("fare",         r.getActualFare());
            map.put("status",       r.getStatus().toString());
            map.put("stressRating", r.getStressRating() != null ? r.getStressRating().toString() : "N/A");
            map.put("audioFlags",   r.getAudioFlagCount());
            map.put("motionFlags",  r.getMotionFlagCount());
            map.put("totalFlags",   r.getTotalFlagCount());
            map.put("startTime",    r.getStartTime() != null ? r.getStartTime().toString() : "N/A");
            map.put("endTime",      r.getEndTime()   != null ? r.getEndTime().toString()   : "N/A");
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "count", rideList.size(),
                "rides", rideList
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/flagged-moments
    // Returns: all flagged moments read from the CSV log file
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/admin/flagged-moments")
    public ResponseEntity<?> getFlaggedMoments() {
        List<Map<String, String>> flaggedMoments = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new FileReader(FLAGGED_LOG))) {
            String headerLine = br.readLine(); // skip header
            if (headerLine == null) return ResponseEntity.ok(Map.of("count", 0, "flaggedMoments", flaggedMoments));

            String[] headers = headerLine.split(",");
            String line;
            while ((line = br.readLine()) != null) {
                // Handle quoted fields (explanation column may contain commas)
                String[] parts = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
                Map<String, String> row = new HashMap<>();
                for (int i = 0; i < headers.length && i < parts.length; i++) {
                    row.put(headers[i].trim(), parts[i].trim().replace("\"", ""));
                }
                flaggedMoments.add(row);
            }
        } catch (IOException e) {
            return ResponseEntity.ok(Map.of("count", 0, "flaggedMoments", flaggedMoments, "note", "Log file not found yet"));
        }

        return ResponseEntity.ok(Map.of(
                "count",          flaggedMoments.size(),
                "flaggedMoments", flaggedMoments
        ));
    }

    // ── Helper ──
    private Map<String, Object> requestSummary(RideRequest r) {
        return Map.of(
                "requestId",   r.getId(),
                "from",        r.getPickupLocation().getLabel(),
                "to",          r.getDropLocation().getLabel(),
                "fare",        r.getEstimatedFare(),
                "distanceKm",  r.getEstimatedDistance(),
                "durationMin", r.getEstimatedDuration()
        );
    }
}
