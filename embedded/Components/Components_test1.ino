#include <Wire.h>
#include "MAX30100_PulseOximeter.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

// =======================
// I2C PINS (shared bus)
// =======================
#define SDA_PIN 8
#define SCL_PIN 9
#define MOTOR_PIN 15
const int GSR_PIN = 1;   

// =======================
// SENSOR OBJECTS
// =======================
PulseOximeter pox;
Adafruit_MPU6050 mpu;

// =======================
// TIMING
// =======================
#define PULSE_REPORT_MS 6000
#define MOTION_WINDOW_MS 20000
#define MOTION_SAMPLE_DELAY_MS 100

unsigned long tsLastPulseReport = 0;
unsigned long windowStart = 0;
unsigned long lastMotionSample = 0;

// =======================
// MAX30100 HEART RATE BUFFER
// =======================
float bpmBuffer[8] = {0};
int bpmIndex = 0;
bool bpmFilled = false;

// =======================
// MOTION ACCUMULATION
// =======================
float motionSum = 0.0;
int sampleCount = 0;
float latestAvgMotion = 0.0;

// =======================
// PULSE LATEST VALUES
// =======================
float latestBpm = 0.0;
float latestSmoothBpm = 0.0;
float latestSpo2 = 0.0;
bool pulseValid = false;

// =======================
// SLEEP LOGIC
// =======================
enum SleepState {
  AWAKE,
  FALLING_ASLEEP,
  ASLEEP,
  RESTLESS_SLEEP
};

SleepState sleepState = AWAKE;

int stillWindows = 0;
int restlessWindows = 0;
int activeWindows = 0;

unsigned long sleepStartTime = 0;
unsigned long totalSleepTime = 0;
int awakenings = 0;

// =======================
// THRESHOLDS
// Tune these experimentally
// =======================
const float STILL_THRESHOLD = 0.6;
const float LIGHT_MOVEMENT_THRESHOLD = 2.2;

// Need several 20-second windows to confirm sleep
const int WINDOWS_TO_FALL_ASLEEP = 6;   // 6 * 20s = 2 minutes
const int WINDOWS_TO_WAKE = 2;          // 40 seconds of clear activity

// =======================
// HELPERS
// =======================
void onBeatDetected() {
  Serial.println("Beat detected!");
}

bool isReasonablePulse(float bpm, float spo2) {
  if (bpm < 45 || bpm > 160) return false;
  if (spo2 < 70 || spo2 > 100) return false;
  return true;
}

float averagedBpm(float newBpm) {
  bpmBuffer[bpmIndex] = newBpm;
  bpmIndex = (bpmIndex + 1) % 8;
  if (bpmIndex == 0) bpmFilled = true;

  int count = bpmFilled ? 8 : bpmIndex;
  float sum = 0;

  for (int i = 0; i < count; i++) {
    sum += bpmBuffer[i];
  }

  return (count > 0) ? (sum / count) : 0;
}

const char* stateToString(SleepState state) {
  switch (state) {
    case AWAKE: return "AWAKE";
    case FALLING_ASLEEP: return "FALLING_ASLEEP";
    case ASLEEP: return "ASLEEP";
    case RESTLESS_SLEEP: return "RESTLESS_SLEEP";
    default: return "UNKNOWN";
  }
}

void printSleepSummary() {
  Serial.println("========== SLEEP STATUS ==========");
  Serial.print("State: ");
  Serial.println(stateToString(sleepState));

  Serial.print("Latest avg motion: ");
  Serial.println(latestAvgMotion, 3);

  if (pulseValid) {
    Serial.print("Heart rate raw: ");
    Serial.print(latestBpm);
    Serial.print(" | avg: ");
    Serial.print(latestSmoothBpm);
    Serial.print(" | SpO2: ");
    Serial.println(latestSpo2);
  } else {
    Serial.println("Pulse: invalid / noisy");
  }

  Serial.print("Still windows: ");
  Serial.println(stillWindows);

  Serial.print("Restless windows: ");
  Serial.println(restlessWindows);

  Serial.print("Awakenings: ");
  Serial.println(awakenings);

  Serial.print("Total sleep time (sec): ");
  Serial.println(totalSleepTime / 1000);

  Serial.println("==================================");
}

void updateSleepLogic(float avgMotion) {
  bool veryStill = avgMotion < STILL_THRESHOLD;
  bool lightMove = (avgMotion >= STILL_THRESHOLD && avgMotion < LIGHT_MOVEMENT_THRESHOLD);
  bool activeMove = avgMotion >= LIGHT_MOVEMENT_THRESHOLD;

  // We trust pulse more when motion is low
  bool calmPulse = pulseValid && latestSmoothBpm >= 45 && latestSmoothBpm <= 95 && latestSpo2 >= 85;

  switch (sleepState) {
    case AWAKE:
      if (veryStill && calmPulse) {
        stillWindows++;
        activeWindows = 0;

        if (stillWindows >= WINDOWS_TO_FALL_ASLEEP / 2) {
          sleepState = FALLING_ASLEEP;
        }
      } else {
        stillWindows = 0;
      }
      break;

    case FALLING_ASLEEP:
      if (veryStill && calmPulse) {
        stillWindows++;
        activeWindows = 0;

        if (stillWindows >= WINDOWS_TO_FALL_ASLEEP) {
          sleepState = ASLEEP;
          sleepStartTime = millis();
          restlessWindows = 0;
          Serial.println(">>> SLEEP DETECTED");
        }
      } else if (lightMove) {
        // Do not fully reset on light movement
        if (stillWindows > 0) stillWindows--;
      } else {
        activeWindows++;
        if (activeWindows >= WINDOWS_TO_WAKE) {
          sleepState = AWAKE;
          stillWindows = 0;
          activeWindows = 0;
        }
      }
      break;

    case ASLEEP:
      if (veryStill) {
        restlessWindows = 0;
        activeWindows = 0;
      } else if (lightMove) {
        restlessWindows++;
        activeWindows = 0;
        sleepState = RESTLESS_SLEEP;
      } else {
        activeWindows++;
        if (activeWindows >= WINDOWS_TO_WAKE) {
          sleepState = AWAKE;
          awakenings++;
          if (sleepStartTime > 0) {
            totalSleepTime += (millis() - sleepStartTime);
            sleepStartTime = 0;
          }
          stillWindows = 0;
          restlessWindows = 0;
          activeWindows = 0;
          Serial.println(">>> WAKE DETECTED");
        }
      }
      break;

    case RESTLESS_SLEEP:
      if (veryStill) {
        restlessWindows = 0;
        activeWindows = 0;
        sleepState = ASLEEP;
      } else if (lightMove) {
        restlessWindows++;
        activeWindows = 0;
      } else {
        activeWindows++;
        if (activeWindows >= WINDOWS_TO_WAKE) {
          sleepState = AWAKE;
          awakenings++;
          if (sleepStartTime > 0) {
            totalSleepTime += (millis() - sleepStartTime);
            sleepStartTime = 0;
          }
          stillWindows = 0;
          restlessWindows = 0;
          activeWindows = 0;
          Serial.println(">>> WAKE DETECTED");
        }
      }
      break;
  }

  // Keep adding time while asleep/restless_sleep
  // but only finalize on wakeup
}

// =======================
// SETUP
// =======================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Wire.begin(SDA_PIN, SCL_PIN);

  // MPU6050
  if (!mpu.begin(0x68)) {
    Serial.println("MPU6050 not found!");
    while (1) delay(1000);
  }

  // MAX30100
  if (!pox.begin()) {
    Serial.println("MAX30100 not found!");
    while (1) delay(1000);
  }
  pox.setOnBeatDetectedCallback(onBeatDetected);

  

  Serial.println("Both sensors initialized.");
  Serial.println("Sleep tracking started.");

  windowStart = millis();
  lastMotionSample = millis();

  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);
}

// =======================
// LOOP
// =======================
void loop() {
  // MAX30100 must be updated frequently
  pox.update();

  unsigned long now = millis();

  // -----------------------
  // Motion sampling
  // -----------------------
  if (now - lastMotionSample >= MOTION_SAMPLE_DELAY_MS) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float ax = a.acceleration.x;
    float ay = a.acceleration.y;
    float az = a.acceleration.z;

    float totalAccel = sqrt(ax * ax + ay * ay + az * az);
    float motion = fabs(totalAccel - 9.8);

    motionSum += motion;
    sampleCount++;

    lastMotionSample = now;
  }

  // -----------------------
  // Pulse reporting
  // -----------------------
  if (now - tsLastPulseReport >= PULSE_REPORT_MS) {
    float bpm = pox.getHeartRate();
    float spo2 = pox.getSpO2();

    if (isReasonablePulse(bpm, spo2)) {
      latestBpm = bpm;
      latestSmoothBpm = averagedBpm(bpm);
      latestSpo2 = spo2;
      pulseValid = true;

      Serial.print("PULSE | BPM raw: ");
      Serial.print(latestBpm);
      Serial.print(" | BPM avg: ");
      Serial.print(latestSmoothBpm);
      uint16_t LATESTAVGBPM = (uint16_t)latestSmoothBpm;                    ////////////////////////////////
      Serial.print(" | SpO2: ");
      Serial.println(latestSpo2);
      uint16_t LATESTAVGSPO2 = (uint16_t)latestSpo2;                        ///////////////////////////////

    } else {
      pulseValid = false;
      Serial.println("PULSE | Ignoring noisy reading...");
    }

    tsLastPulseReport = now;
  }

  // -----------------------
  // 20-second motion window
  // -----------------------
  if (now - windowStart >= MOTION_WINDOW_MS) {
    if (sampleCount > 0) {
      latestAvgMotion = motionSum / sampleCount;
    } else {
      latestAvgMotion = 0.0;
    }

    Serial.println("-------- 20 SECOND RESULT --------");
    Serial.print("Samples: ");
    Serial.println(sampleCount);
    Serial.print("Average motion: ");
    Serial.println(latestAvgMotion, 3);

    if (latestAvgMotion < STILL_THRESHOLD) {
      uint16_t LATESTMOTION = 1;                                              ////////////////////////////////////////
      Serial.println("MOTION STATUS: STILL");
    } else if (latestAvgMotion < LIGHT_MOVEMENT_THRESHOLD) {
      LATESTMOTION = 2;                                                       ////////////////////////////////////////
      Serial.println("MOTION STATUS: WALKING / LIGHT MOVEMENT");
    } else {
      LATESTMOTION = 3;                                                       ////////////////////////////////////////
      Serial.println("MOTION STATUS: RUNNING / STRONG MOVEMENT");
    }

    updateSleepLogic(latestAvgMotion);
    uint16_t sleepStateUint = (uint16_t)sleepState;                           ////////////////////////////////////////
    printSleepSummary();

    motionSum = 0.0;
    sampleCount = 0;
    windowStart = now;
  }
    
   digitalWrite(MOTOR_PIN, HIGH);
   delay(2000);
   digitalWrite(MOTOR_PIN,LOW);
   delay(2000);
   int value = analogRead(GSR_PIN);
   Serial.println(value);

   uint16_t GSRFINAL = (uint16_t)value;                                        ////////////////////////////////////////
   delay(2000);

  


}