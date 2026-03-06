package com.uber.models;

import com.uber.enums.RideStatus;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class Driver {

    private final String      id;
    private final String      name;
    private       Shift       currentShift;
    private       EarningGoal earningGoal;
    private final List<Ride>  rides;

    public Driver(String name) {
        this.id     = UUID.randomUUID().toString().substring(0, 8);
        this.name   = name;
        this.rides  = new ArrayList<>();
    }

    public void addRide(Ride ride) {
        rides.add(ride);
    }

    public List<Ride> getRidesByStatus(RideStatus status) {
        return rides.stream()
                .filter(r -> r.getStatus() == status)
                .collect(Collectors.toList());
    }

    public double getTotalEarned() {
        double res =  rides.stream()
                .filter(r -> r.getStatus() == RideStatus.COMPLETED)
                .mapToDouble(Ride::getActualFare)
                .sum();
        Ride ongoing = rides.stream()
                .filter(r-> r.getStatus() == RideStatus.ONGOING)
                .findFirst().orElse(null);
        if(ongoing == null) return (res);
        double tripPassed = Duration.between(ongoing.getStartTime(), LocalTime.now()).toMinutes() / 60.0;
        res += ((double)((double)ongoing.getActualFare()/(double)ongoing.getDuration())) * tripPassed;
        return res;
    }

    public String      getId()           { return id; }
    public String      getName()         { return name; }
    public Shift       getCurrentShift() { return currentShift; }
    public EarningGoal getEarningGoal()  { return earningGoal; }
    public List<Ride>  getRides()        { return Collections.unmodifiableList(rides); }

    public void setCurrentShift(Shift shift)       { this.currentShift = shift; }
    public void setEarningGoal(EarningGoal goal)   { this.earningGoal = goal; }

    @Override
    public String toString() {
        return String.format("Driver[id=%s, name=%s]", id, name);
    }
}
