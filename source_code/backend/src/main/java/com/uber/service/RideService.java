package com.uber.service;

import com.uber.enums.RideStatus;
import com.uber.models.*;
import com.uber.repository.DriverRepository;
import com.uber.repository.RideRepository;
import com.uber.repository.RideRequestRepository;
import org.springframework.stereotype.Service; // ── CHANGE: added

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class RideService {

    private final RideRepository        rideRepo;
    private final RideRequestRepository rideRequestRepo;
    private final DriverRepository      driverRepo;
    private final CsvLogger             csvLogger;
    private final EarningVelocityService earningVelocityService;

    public RideService(RideRepository rideRepo,
                       RideRequestRepository rideRequestRepo,
                       DriverRepository driverRepo,
                       CsvLogger csvLogger,
                       EarningVelocityService earningVelocityService) {
        this.rideRepo        = rideRepo;
        this.rideRequestRepo = rideRequestRepo;
        this.driverRepo      = driverRepo;
        this.csvLogger       = csvLogger;
        this.earningVelocityService = earningVelocityService;
    }

    public Ride acceptRide(Driver driver, RideRequest request) {
        Ride ride = new Ride(driver, request);
        ride.setStatus(RideStatus.ONGOING);
        ride.setStartTime(LocalDateTime.now());
        ride.setEndTime(LocalDateTime.now().plus(Duration.ofMinutes(request.getEstimatedDuration())));
        rideRequestRepo.remove(request.getId());
        rideRepo.save(ride);
        driver.addRide(ride);
        return ride;
    }

    public void rejectRide(RideRequest request) {
        rideRequestRepo.remove(request.getId());
    }

    public void completeRide(Ride ride) {
        if (ride.getStatus() != RideStatus.ONGOING) {
            throw new IllegalStateException("Only ONGOING rides can be completed.");
        }
        ride.setStatus(RideStatus.COMPLETED);
        ride.setEndTime(LocalDateTime.now());
        rideRepo.save(ride);

        EarningVelocity ev = earningVelocityService.calculate(ride.getDriver(), ride.getDriver().getCurrentShift(), ride.getEndTime());
        ride.getDriver().getEarningGoal().addEarning(ride.getActualFare());
        ride.getDriver().getEarningGoal().setEarningVelocity(ev);

        csvLogger.logRideSummary(ride);
        System.out.printf("[RideService] Ride COMPLETED | ID: %s | Fare: ₹%.2f | Duration: %d min%n",
                ride.getId(), ride.getActualFare(), ride.getDuration());
    }

    public List<Ride> getRidesByDriver(String driverId, RideStatus status) {
        Driver driver = driverRepo.findById(driverId);
        return driver.getRidesByStatus(status);
    }
}