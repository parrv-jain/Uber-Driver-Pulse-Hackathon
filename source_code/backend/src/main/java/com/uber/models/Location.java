package com.uber.models;

public final class Location {

    private final double latitude;
    private final double longitude;
    private final String label;

    public Location(double latitude, double longitude, String label) {
        this.latitude  = latitude;
        this.longitude = longitude;
        this.label     = label;
    }

    // Haversine formula — distance in km between two coordinates
    public double distanceTo(Location other) {
        final double R = 6371.0;
        double dLat = Math.toRadians(other.latitude - this.latitude);
        double dLon = Math.toRadians(other.longitude - this.longitude);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(this.latitude))
                 * Math.cos(Math.toRadians(other.latitude))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public double getLatitude()  { return latitude; }
    public double getLongitude() { return longitude; }
    public String getLabel()     { return label; }

    @Override
    public String toString() {
        return label + " (" + latitude + ", " + longitude + ")";
    }
}
