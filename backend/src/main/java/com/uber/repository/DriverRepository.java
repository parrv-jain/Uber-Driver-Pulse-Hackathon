package com.uber.repository;

import com.uber.models.Driver;
import org.springframework.stereotype.Repository; // ── CHANGE: added

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class DriverRepository {

    private final Map<String, Driver> store = new HashMap<>();

    public void save(Driver driver) {
        store.put(driver.getId(), driver);
    }

    public Driver findById(String id) {
        return store.get(id);
    }

    public List<Driver> findAll() {
        return new ArrayList<>(store.values());
    }

    public void delete(String id) {
        store.remove(id);
    }

    public boolean exists(String id) {
        return store.containsKey(id);
    }
}