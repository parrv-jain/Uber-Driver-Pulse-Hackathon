package com.uber.repository;

import com.uber.models.Ride;
import org.springframework.stereotype.Repository; // ── CHANGE: added

import java.util.*;

@Repository
public class RideRepository {

    private final Map<String, Ride> store = new HashMap<>();

    public void save(Ride ride) { store.put(ride.getId(), ride); }

    public Ride findById(String id) { return store.get(id); }

    public List<Ride> findAll() { return new ArrayList<>(store.values()); }
}