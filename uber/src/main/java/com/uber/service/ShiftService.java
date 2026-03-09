package com.uber.service;

import com.uber.models.Driver;
import com.uber.models.Shift;
import com.uber.repository.DriverRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
public class ShiftService {

    private final DriverRepository driverRepo;

    public ShiftService(DriverRepository driverRepo) {
        this.driverRepo = driverRepo;
    }

    public Shift startShift(Driver driver, LocalDateTime endTime) {
        if (driver.getCurrentShift() != null && driver.getCurrentShift().isActive()) {
            throw new IllegalStateException("Driver " + driver.getName() + " already has an active shift.");
        }
        LocalDateTime startTime = LocalDateTime.now();
        Shift shift = new Shift(driver.getId(), startTime, endTime);
        shift.activate();
        driver.setCurrentShift(shift);
        driverRepo.save(driver);
        System.out.println("[ShiftService] Shift started for " + driver.getName()
                + " | " + startTime + " → " + endTime);
        return shift;
    }

    public void endShift(Driver driver) {
        Shift shift = driver.getCurrentShift();
        if (shift == null || !shift.isActive()) {
            throw new IllegalStateException("No active shift found for " + driver.getName());
        }
        shift.end();
        driverRepo.save(driver);
        System.out.printf("[ShiftService] Shift ended for %s | Hours worked: %.2f%n",
                driver.getName(), shift.getHoursWorked());
    }
}