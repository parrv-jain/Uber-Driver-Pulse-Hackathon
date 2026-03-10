package com.uber.models;

import java.time.LocalDateTime;
import java.util.UUID;

public class RideRequest {

    private final String        id;
    private final Location      pickupLocation;
    private final Location      dropLocation;
    private final double        estimatedFare;
    private final double        estimatedDistance; // km
    private final int           estimatedDuration; // minutes
    private final LocalDateTime createdAt;

    public RideRequest(Location pickupLocation,
                       Location dropLocation,
                       double estimatedFare,
                       double estimatedDistance,
                       int estimatedDuration) {
        this.id                = UUID.randomUUID().toString().substring(0, 8);
        this.pickupLocation    = pickupLocation;
        this.dropLocation      = dropLocation;
        this.estimatedFare     = estimatedFare;
        this.estimatedDistance = estimatedDistance;
        this.estimatedDuration = estimatedDuration;
        this.createdAt         = LocalDateTime.now();
    }

    public String        getId()                { return id; }
    public Location      getPickupLocation()    { return pickupLocation; }
    public Location      getDropLocation()      { return dropLocation; }
    public double        getEstimatedFare()     { return estimatedFare; }
    public double        getEstimatedDistance() { return estimatedDistance; }
    public int           getEstimatedDuration() { return estimatedDuration; }
    public LocalDateTime getCreatedAt()         { return createdAt; }

    @Override
    public String toString() {
        return String.format("RideRequest[id=%s, from=%s, to=%s, fare=₹%.2f, dist=%.1fkm, dur=%dmin]",
                id, pickupLocation.getLabel(), dropLocation.getLabel(),
                estimatedFare, estimatedDistance, estimatedDuration);
    }
}
