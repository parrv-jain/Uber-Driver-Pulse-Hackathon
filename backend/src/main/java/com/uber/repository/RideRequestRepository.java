package com.uber.repository;

import com.uber.models.RideRequest;
import org.springframework.stereotype.Repository; // ── CHANGE: added

import java.util.*;

@Repository 
public class RideRequestRepository {

    private final List<RideRequest> available = new ArrayList<>();

    public void add(RideRequest request) {
        available.add(request);
    }

    public void remove(String id) {
        available.removeIf(r -> r.getId().equals(id));
    }

    public List<RideRequest> getAll() {
        return Collections.unmodifiableList(available);
    }

    public Optional<RideRequest> findById(String id) {
        return available.stream().filter(r -> r.getId().equals(id)).findFirst();
    }

    public boolean isEmpty() {
        return available.isEmpty();
    }
}