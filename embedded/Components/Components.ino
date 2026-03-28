#include <Wire.h>
#include "MAX30100_PulseOximeter.h"
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

//===========
//ble
//===========
BLEServer* pServer = nullptr;
BLECharacteristic* biodataChar = nullptr;

bool deviceConnected = false;

#define SERVICE_UUID      "12345678-1234-1234-1234-1234567890ab"
#define BIODATA_CHAR_UUID "abcd1234-5678-90ab-cdef-1234567890ab"  // NOTIFY  (ESP32 → phone)
#define RX_CHAR_UUID      "abcdefab-1234-1234-1234-abcdefabcdef"  // WRITE   (phone  → ESP32)

// Packet types — must match esp32-biodata.ts
#define TYPE_HEART_RATE 1
#define TYPE_SPO2       2
#define TYPE_MOVEMENT   3
#define TYPE_GSR        4

//=========
//usendtoble
//===============
void usendtoble(uint16_t type, uint16_t value) {
  if (!deviceConnected || biodataChar == nullptr) return;
  uint8_t packet[4] = {
    (uint8_t)(type & 0xFF),  (uint8_t)(type >> 8),
    (uint8_t)(value & 0xFF), (uint8_t)(value >> 8)
  };
  biodataChar->setValue(packet, 4);
  biodataChar->notify();
}
// =======================
// PINS
// =======================
#define SDA_PIN 8
#define SCL_PIN 9
#define GSR_PIN 1
#define VIBRATION_PIN 13
// =======================
// SENSOR OBJECTS
// =======================
PulseOximeter pox;
Adafruit_MPU6050 mpu;

// =======================
// TIMING
// =======================
#define PULSE_SAMPLE_MS 6000
#define MOTION_SAMPLE_MS 100
#define GSR_SAMPLE_MS 100
#define SEND_INTERVAL_MS 300000  //5 minutes
#define DEFAULT_GSR_BASELINE 2400
int gsr_baseline = DEFAULT_GSR_BASELINE;
bool hasBleGsrBaseline = false;

unsigned long lastPulseSample = 0;
unsigned long lastMotionSample = 0;
unsigned long lastGsrSample = 0;
unsigned long lastSendTime = 0;

// =======================
// MOTION THRESHOLDS
// =======================
const float STILL_THRESHOLD = 0.6;
const float LIGHT_MOVEMENT_THRESHOLD = 2.2;

// =======================
// ENUMS
// =======================
enum MotionState : uint16_t {
  MOTION_STILL = 1,
  MOTION_WALKING = 2,
  MOTION_RUNNING = 3
};

enum GsrState : uint16_t {
  GSR_NORMAL = 1,
  GSR_TENSE = 2,
  GSR_SIGNIFICANTLY_STRESSED = 3,
  GSR_CALM = 4,
  GSR_HAPPY = 5
};
MotionState classifyMotion(float avgMotion);
GsrState classifyGsr(uint16_t avgGsr, int gsr_baseline);
const char* motionStateToString(MotionState state);
const char* gsrStateToString(GsrState state);

// =======================
// BPM SMOOTHING BUFFER
// =======================
float bpmBuffer[8] = { 0 };
int bpmIndex = 0;
bool bpmFilled = false;

// =======================
// 5-MINUTE ACCUMULATORS
// =======================
float heartRateSum = 0.0;
uint32_t heartRateCount = 0;

float spo2Sum = 0.0;
uint32_t spo2Count = 0;

float motionSum = 0.0;
uint32_t motionCount = 0;

uint32_t gsrSum = 0;
uint32_t gsrCount = 0;

// =======================
// FINAL VALUES TO SEND
// =======================
uint16_t heartRateAvg5Min = 0;
uint16_t spo2Avg5Min = 0;
uint16_t accelerometerState5Min = 0;
uint16_t gsrState5Min = 0;

// =======================
// PLACEHOLDER SEND FUNCTION
// =======================


// =======================
// VIBRATION (non-blocking)
// =======================
#define VIBRATION_DURATION_MS 600
unsigned long vibrationEndTime = 0;
bool isVibrating = false;

void startVibration() {
  digitalWrite(VIBRATION_PIN, HIGH);
  vibrationEndTime = millis() + VIBRATION_DURATION_MS;
  isVibrating = true;
}

void updateVibration() {
  if (isVibrating && millis() >= vibrationEndTime) {
    digitalWrite(VIBRATION_PIN, LOW);
    isVibrating = false;
  }
}

//==========
//ble callback classes
//==================
class RxCharCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pChar) {
    String value = pChar->getValue();
    if (value == "VIBRATE") {
      startVibration();
    }
  }
};

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    delay(500);
    BLEDevice::startAdvertising();
  }
};

// =======================
// HELPERS
// =======================
void onBeatDetected() {
  // optional
}

bool isReasonablePulse(float bpm, float spo2) {
  if (bpm < 45 || bpm > 160) return false;
  if (spo2 < 70 || spo2 > 100) return false;
  return true;
}

float averagedBpm(float newBpm) {
  bpmBuffer[bpmIndex] = newBpm;
  bpmIndex = (bpmIndex + 1) % 8;

  if (bpmIndex == 0) {
    bpmFilled = true;
  }

  int count = bpmFilled ? 8 : bpmIndex;
  if (count == 0) return 0.0;

  float sum = 0.0;
  for (int i = 0; i < count; i++) {
    sum += bpmBuffer[i];
  }

  return sum / count;
}

MotionState classifyMotion(float avgMotion) {
  if (avgMotion < STILL_THRESHOLD) {
    return MOTION_STILL;
  } else if (avgMotion < LIGHT_MOVEMENT_THRESHOLD) {
    return MOTION_WALKING;
  } else {
    return MOTION_RUNNING;
  }
}

GsrState classifyGsr(uint16_t avgGsr, int gsr_baseline) {
  int delta = avgGsr - gsr_baseline;
  if (delta < 100 && delta > 0) {
    return GSR_NORMAL;
  } else if (delta >= 100 && delta <= 250) {
    return GSR_TENSE;
  } else if (delta >= 250) {
    return GSR_SIGNIFICANTLY_STRESSED;
  } else if (delta < 0 && delta > -100) {
    return GSR_CALM;
  } else if (delta < -100) {
    return GSR_HAPPY;
  }
  return GSR_NORMAL;
}


const char* motionStateToString(MotionState state) {
  switch (state) {
    case MOTION_STILL: return "STILL";
    case MOTION_WALKING: return "WALKING";
    case MOTION_RUNNING: return "RUNNING";
    default: return "UNKNOWN";
  }
}

const char* gsrStateToString(GsrState state) {
  switch (state) {
    case GSR_NORMAL: return "NORMAL";
    case GSR_CALM: return "CALM";
    case GSR_TENSE: return "TENSE";
    case GSR_SIGNIFICANTLY_STRESSED: return "SIGNIFICANTLY_STRESSED";
    case GSR_HAPPY: return "HAPPY";
    default: return "UNKNOWN";
  }
}

void resetFiveMinuteAccumulators() {
  heartRateSum = 0.0;
  heartRateCount = 0;

  spo2Sum = 0.0;
  spo2Count = 0;

  motionSum = 0.0;
  motionCount = 0;

  gsrSum = 0;
  gsrCount = 0;
}

void set_gsr_baseline(uint16_t gsr_baseline_ble) {  // call if ble sends new value
  gsr_baseline = gsr_baseline_ble;
  hasBleGsrBaseline = true;
}
// =======================
// SETUP
// =======================
void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(VIBRATION_PIN, OUTPUT);
  digitalWrite(VIBRATION_PIN, LOW);

  // Initialize BLE
  BLEDevice::init("FeelSync");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  biodataChar = pService->createCharacteristic(
    BIODATA_CHAR_UUID,
    BLECharacteristic::PROPERTY_NOTIFY);
  biodataChar->addDescriptor(new BLE2902());

  // Write characteristic — receives commands from phone (e.g. "VIBRATE")
  BLECharacteristic* rxChar = pService->createCharacteristic(
    RX_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE);
  rxChar->setCallbacks(new RxCharCallbacks());

  pService->start();

  // Start advertising
  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->start();

  Serial.println("BLE initialized and advertising...");

  Wire.begin(SDA_PIN, SCL_PIN);

  if (!mpu.begin(0x68)) {
    Serial.println("MPU6050 not found!");
    while (1) delay(1000);
  }

  if (!pox.begin()) {
    Serial.println("MAX30100 not found!");
    while (1) delay(1000);
  }

  pox.setOnBeatDetectedCallback(onBeatDetected);

  lastPulseSample = millis();
  lastMotionSample = millis();
  lastGsrSample = millis();
  lastSendTime = millis();

  resetFiveMinuteAccumulators();

  Serial.println("Sensors initialized.");
}

// =======================
// LOOP
// =======================
void loop() {
  pox.update();
  updateVibration();  // non-blocking motor off-timer

  unsigned long now = millis();

  // -----------------------
  // Heart rate + SpO2 sample
  // -----------------------
  if (now - lastPulseSample >= PULSE_SAMPLE_MS) {
    float bpm = pox.getHeartRate();
    float spo2 = pox.getSpO2();

    if (isReasonablePulse(bpm, spo2)) {
      float smoothBpm = averagedBpm(bpm);

      heartRateSum += smoothBpm;
      heartRateCount++;

      spo2Sum += spo2;
      spo2Count++;
    }

    lastPulseSample = now;
  }



  // -----------------------
  // Accelerometer sample
  // -----------------------
  if (now - lastMotionSample >= MOTION_SAMPLE_MS) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    float ax = a.acceleration.x;
    float ay = a.acceleration.y;
    float az = a.acceleration.z;

    float totalAccel = sqrt(ax * ax + ay * ay + az * az);
    float motion = fabs(totalAccel - 9.8);

    motionSum += motion;
    motionCount++;

    lastMotionSample = now;
  }

  // -----------------------
  // GSR sample
  // -----------------------
  if (now - lastGsrSample >= GSR_SAMPLE_MS) {
    uint16_t gsrValue = analogRead(GSR_PIN);

    gsrSum += gsrValue;
    gsrCount++;

    lastGsrSample = now;
  }

  // -----------------------
  // Every 5 minutes:
  // calculate averages/states
  // save final values
  // call usendtoble(...)
  // -----------------------
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    // Heart rate average
    if (heartRateCount > 0) {
      heartRateAvg5Min = (uint16_t)(heartRateSum / heartRateCount);
    } else {
      heartRateAvg5Min = 0;
    }

    // SpO2 average
    if (spo2Count > 0) {
      spo2Avg5Min = (uint16_t)(spo2Sum / spo2Count);
    } else {
      spo2Avg5Min = 0;
    }

    // Motion average -> state 1/2/3
    float avgMotion = 0.0;
    if (motionCount > 0) {
      avgMotion = motionSum / motionCount;
    }

    accelerometerState5Min = (uint16_t)classifyMotion(avgMotion);

    // GSR average -> state 1/2/3
    uint16_t avgGsr = 0;
    if (gsrCount > 0) {
      avgGsr = (uint16_t)(gsrSum / gsrCount);
    }

    gsrState5Min = (uint16_t)classifyGsr(avgGsr, gsr_baseline);

    // Debug print

    Serial.print("Heart Rate Avg: ");
    Serial.println(heartRateAvg5Min);

    Serial.print("SpO2 Avg: ");
    Serial.println(spo2Avg5Min);

    Serial.print("Motion Avg: ");
    Serial.println(avgMotion, 3);
    Serial.print("Motion State: ");
    Serial.print(accelerometerState5Min);
    Serial.print(" (");
    Serial.print(motionStateToString((MotionState)accelerometerState5Min));
    Serial.println(")");

    Serial.print("GSR Avg: ");
    Serial.println(avgGsr);
    Serial.print("GSR State: ");
    Serial.print(gsrState5Min);
    Serial.print(" (");
    Serial.print(gsrStateToString((GsrState)gsrState5Min));
    Serial.println(")");

    Serial.println("============================");

    usendtoble(TYPE_HEART_RATE, heartRateAvg5Min);
    usendtoble(TYPE_SPO2,       spo2Avg5Min);
    usendtoble(TYPE_MOVEMENT,   accelerometerState5Min);
    usendtoble(TYPE_GSR,        gsrState5Min);

    resetFiveMinuteAccumulators();
    lastSendTime = now;
  }
}