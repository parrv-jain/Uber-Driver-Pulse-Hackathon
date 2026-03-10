package com.uber.models;

import com.uber.enums.ShiftStatus;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.UUID;

public class Shift {

    private final String      id;
    private final String      driverId;
    private final LocalDateTime startTime;
    private final LocalDateTime   endTime;
    private       ShiftStatus status;

    public Shift(String driverId, LocalDateTime startTime, LocalDateTime endTime) {
        this.id        = UUID.randomUUID().toString().substring(0, 8);
        this.driverId  = driverId;
        this.startTime = startTime;
        this.endTime   = endTime;
        this.status    = ShiftStatus.NOT_STARTED;
    }

    // Total planned shift duration in hours
    public double getTotalShiftHours() {
        return Duration.between(startTime, endTime).toMinutes() / 60.0;
    }

    // Hours elapsed from startTime up to now (capped at total shift hours)
    public double getHoursWorked() {
        if (status == ShiftStatus.NOT_STARTED) return 0.0;
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startTime)) return 0.0;
        LocalDateTime cap = now.isAfter(endTime) ? endTime : now;
        return Duration.between(startTime, cap).toMinutes() / 60.0;
    }

    // Hours remaining until endTime
    public double getHoursRemaining() {
        if (status == ShiftStatus.ENDED) return 0.0;
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(endTime)) return 0.0;
        return Duration.between(now, endTime).toMinutes() / 60.0;
    }

    public boolean isActive() {
        return status == ShiftStatus.ACTIVE;
    }

    public void activate() { this.status = ShiftStatus.ACTIVE; }
    public void end()      { this.status = ShiftStatus.ENDED; }

    public String      getId()        { return id; }
    public String      getDriverId()  { return driverId; }
    public LocalDateTime   getStartTime() { return startTime; }
    public LocalDateTime   getEndTime()   { return endTime; }
    public ShiftStatus getStatus()    { return status; }

    @Override
    public String toString() {
        return String.format("Shift[id=%s, driver=%s, %s–%s, status=%s]",
                id, driverId, startTime, endTime, status);
    }
}
