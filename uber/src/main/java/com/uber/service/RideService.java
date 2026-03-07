package com.uber.service;

import com.uber.enums.RideStatus;
import com.uber.models.Driver;
import com.uber.models.Ride;
import com.uber.models.RideRequest;
import com.uber.repository.DriverRepository;
import com.uber.repository.RideRepository;
import com.uber.repository.RideRequestRepository;
import java.time.LocalDateTime;
import java.util.List;

public class RideService {

    private final RideRepository        rideRepo;
    private final RideRequestRepository rideRequestRepo;
    private final DriverRepository driverRepo;

    public RideService(RideRepository rideRepo, RideRequestRepository rideRequestRepo, DriverRepository driverRepo) {
        this.rideRepo = rideRepo;
        this.rideRequestRepo = rideRequestRepo;
        this.driverRepo = driverRepo;
    }

    // NEW — Ride only born on acceptance
    public Ride acceptRide(Driver driver, RideRequest request) {
        Ride ride = new Ride(driver, request); // ✅ created here
        ride.setStatus(RideStatus.ONGOING);
        ride.setStartTime(LocalDateTime.now());
        rideRequestRepo.remove(request.getId());
        rideRepo.save(ride);
        driver.addRide(ride);
        return ride;
    }

    public void rejectRide(RideRequest request) {
        rideRequestRepo.remove(request.getId());
        // nothing else — no Ride object, no storage
    }
    public void completeRide(Ride ride) {
        if (ride.getStatus() != RideStatus.ONGOING) {
            throw new IllegalStateException("Only ONGOING rides can be completed.");
        }
        ride.setStatus(RideStatus.COMPLETED);
        ride.setEndTime(LocalDateTime.now());
        rideRepo.save(ride);
        System.out.printf("[RideService] Ride COMPLETED | ID: %s | Fare: ₹%.2f | Duration: %d min%n",
                ride.getId(), ride.getActualFare(), ride.getDuration());
    }

    public List<Ride> getRidesByDriver(String driverId, RideStatus status) {
        Driver driver = driverRepo.findById(driverId);
        return driver.getRidesByStatus(status);
    }
}
