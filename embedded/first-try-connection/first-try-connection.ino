#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

BLECharacteristic *pCharacteristicTX;
bool deviceConnected = false;

#define SERVICE_UUID        "12345678-1234-1234-1234-123456789abc"
#define CHARACTERISTIC_RX   "abcd"  // телефон -> ESP32
#define CHARACTERISTIC_TX   "efgh"  // ESP32 -> телефон

class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    String value = pCharacteristic->getValue();

    if (value.length() > 0) {
      Serial.println("From the smartphone:");
      Serial.println(value);
    }
  }
};

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
  };

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
  }
};

void setup() {
  Serial.begin(115200);

  BLEDevice::init("FeelSinc");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // RX (получаване)
  BLECharacteristic *pCharacteristicRX = pService->createCharacteristic(
                       CHARACTERISTIC_RX,
                       BLECharacteristic::PROPERTY_WRITE
                     );
  pCharacteristicRX->setCallbacks(new MyCallbacks());

  // TX (изпращане)
  pCharacteristicTX = pService->createCharacteristic(
                       CHARACTERISTIC_TX,
                       BLECharacteristic::PROPERTY_NOTIFY
                     );
  pCharacteristicTX->addDescriptor(new BLE2902());

  pService->start();
  pServer->getAdvertising()->start();

  Serial.println("Waiting to connect...");
}

void loop() {
  if (deviceConnected) {
    String data = "Bachka!";
    pCharacteristicTX->setValue(data.c_str());
    pCharacteristicTX->notify();
    delay(2000);
  }
}