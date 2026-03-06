package com.uber.models;

public final class MotionData {

    private final double speed;         // km/h
    private final double acc_x;  // m/s²
    private final double acc_y;  // m/s²
    private final double acc_z;  // m/s²
    private final double latitude;
    private final double longitude;

    public MotionData(double speed, double acc_x, double acc_y, double acc_z, double latitude, double longitude) {
        this.speed        = speed;
        this.acc_x = acc_x;
        this.acc_y = acc_y;
        this.acc_z = acc_z;
        this.latitude     = latitude;
        this.longitude    = longitude;
    }

    public double getSpeed()        { return speed; }
    public double getAcceleration(){
        return Math.sqrt(Math.pow(this.acc_x, 2) + Math.pow(this.acc_y, 2) + Math.pow(this.acc_z, 2));
    }
    public double getLatitude()     { return latitude; }
    public double getLongitude()    { return longitude; }

//    @Override
//    public String toString() {
//        return String.format("Motion[%.1f km/h, %.2f m/s², (%.4f, %.4f)]",
//                speed, acceleration, latitude, longitude);
//    }
}
