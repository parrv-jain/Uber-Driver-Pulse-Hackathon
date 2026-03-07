package com.uber.repository;

import com.uber.models.Ride;
import java.util.*;

public class RideRepository {

    private final Map<String, Ride> store = new HashMap<>();

    public void save(Ride ride) { store.put(ride.getId(), ride); }

    public Ride findById(String id) { return store.get(id); }

    public List<Ride> findAll() { return new ArrayList<>(store.values()); }
}