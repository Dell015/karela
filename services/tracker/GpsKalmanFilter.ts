/**
 * ============================================================
 * GPS KALMAN FILTER — Karela Spatial Accuracy Layer
 * ============================================================
 *
 * A 1-dimensional Kalman filter applied independently to latitude and
 * longitude, with measurement noise driven by the GPS accuracy reading
 * and process noise driven by expected movement speed.
 *
 * This replaces naive fixed-weight exponential smoothing. The key advantage:
 * the filter trusts high-accuracy fixes more and low-accuracy fixes less,
 * automatically — instead of blending every point by the same amount.
 *
 * Reference model (standard GPS Kalman, Stochastic 1-D):
 *   Prediction:   variance += Δt × Q²
 *   Gain:         K = variance / (variance + accuracy²)
 *   Update:       state += K × (measurement − state)
 *                 variance = (1 − K) × variance
 *
 * Where:
 *   Q        = process noise (meters/second) — how fast position can change
 *   accuracy = GPS-reported horizontal accuracy (meters, 1σ)
 *   variance = current estimate uncertainty (meters²)
 *   K        = Kalman gain (0–1): 0 = ignore measurement, 1 = trust fully
 */

export interface FilteredPosition {
  latitude: number;
  longitude: number;
  accuracy: number;     // estimated accuracy after filtering (meters)
  timestamp: number;
}

export class GpsKalmanFilter {
  private minAccuracy = 1;        // floor for accuracy (meters)
  private qMetresPerSecond: number; // process noise
  private timestampMs = 0;
  private lat = 0;
  private lng = 0;
  private variance = -1;          // < 0 means "uninitialized"

  /**
   * @param processNoise — expected movement speed in m/s.
   *   Running ≈ 3 m/s. Lower = smoother but laggier. Higher = more responsive.
   */
  constructor(processNoise: number = 3) {
    this.qMetresPerSecond = processNoise;
  }

  /**
   * Resets the filter (call when a new run starts).
   */
  reset() {
    this.variance = -1;
    this.timestampMs = 0;
  }

  /**
   * Allows dynamic adjustment of process noise based on detected activity.
   * (e.g., walking → 1.5, running → 3, sprinting → 5)
   */
  setProcessNoise(qMetresPerSecond: number) {
    this.qMetresPerSecond = qMetresPerSecond;
  }

  /**
   * Feeds a new GPS measurement and returns the filtered position.
   */
  process(
    latMeasurement: number,
    lngMeasurement: number,
    accuracy: number,
    timestampMs: number
  ): FilteredPosition {
    // Clamp accuracy to a sensible floor
    let acc = accuracy;
    if (acc < this.minAccuracy) acc = this.minAccuracy;

    if (this.variance < 0) {
      // First measurement — initialize state
      this.timestampMs = timestampMs;
      this.lat = latMeasurement;
      this.lng = lngMeasurement;
      this.variance = acc * acc;
    } else {
      // Prediction step: grow uncertainty proportional to elapsed time
      const timeIncMs = timestampMs - this.timestampMs;
      if (timeIncMs > 0) {
        this.variance +=
          (timeIncMs * this.qMetresPerSecond * this.qMetresPerSecond) / 1000;
        this.timestampMs = timestampMs;
      }

      // Update step: blend measurement with prediction via Kalman gain
      const k = this.variance / (this.variance + acc * acc);
      this.lat += k * (latMeasurement - this.lat);
      this.lng += k * (lngMeasurement - this.lng);
      this.variance = (1 - k) * this.variance;
    }

    return {
      latitude: this.lat,
      longitude: this.lng,
      accuracy: Math.sqrt(this.variance),
      timestamp: this.timestampMs,
    };
  }

  /**
   * Returns the current estimated accuracy (meters), or null if uninitialized.
   */
  getAccuracy(): number | null {
    return this.variance < 0 ? null : Math.sqrt(this.variance);
  }
}
