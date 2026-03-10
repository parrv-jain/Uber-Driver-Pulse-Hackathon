package com.uber.models;

public final class MotionData {

    private final double acc_x;  // m/s²
    private final double acc_y;  // m/s²
    private final double acc_z;  // m/s²
    private final double speed;
    private final double latitude;
    private final double longitude;

    public MotionData(double acc_x, double acc_y, double acc_z, double speed, double latitude, double longitude) {
        this.acc_x = acc_x;
        this.acc_y = acc_y;
        this.acc_z = acc_z;
        this.speed = speed;
        this.latitude     = latitude;
        this.longitude    = longitude;
    }

    public double getAcceleration(){
        return Math.sqrt(Math.pow(this.acc_x, 2) + Math.pow(this.acc_y, 2));
    }
    public double getLatitude()     { return latitude; }
    public double getLongitude()    { return longitude; }

    public double getAcc_z() { return acc_z; }
    public double getAcc_x() { return acc_x; }
    public double getAcc_y() { return acc_y; }
    public double getSpeed() { return speed; }

//    @Override
//    public String toString() {
//        return String.format("Motion[%.1f km/h, %.2f m/s², (%.4f, %.4f)]",
//                speed, acceleration, latitude, longitude);
//    }
}
