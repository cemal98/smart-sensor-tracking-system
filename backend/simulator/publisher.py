import os
import time
import random
import json
import psycopg2
import paho.mqtt.client as mqtt
from dotenv import load_dotenv

load_dotenv()

# MQTT Ayarları
MQTT_BROKER = os.getenv("MQTT_BROKER")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC_PREFIX = os.getenv("MQTT_TOPIC_PREFIX", "sensors")

# PostgreSQL Bağlantısı
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    database=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD")
)

cursor = conn.cursor()
cursor.execute('SELECT id, "mqttTopic" FROM "sensors" WHERE "isActive" = true')
sensors = cursor.fetchall()

# MQTT Client tanımı
client = mqtt.Client()
client.connect(MQTT_BROKER, MQTT_PORT, 60)

def generate_sensor_data(sensor_id):
    return {
        "sensor_id": sensor_id,
        "timestamp": int(time.time()),
        "temperature": round(random.uniform(20.0, 30.0), 2),
        "humidity": round(random.uniform(40.0, 60.0), 2)
    }

try:
    print("Veri yayınlanıyor...")
    while True:
        for sensor_id, mqtt_topic in sensors:
            data = generate_sensor_data(sensor_id)
            topic = mqtt_topic or f"{MQTT_TOPIC_PREFIX}/{sensor_id}"
            
            client.publish(topic, payload=json.dumps(data))
            print(f"Yayınlandı: {topic} => {data}")
            time.sleep(1)
        
        time.sleep(3) 

except KeyboardInterrupt:
    print("Simülasyon durduruldu.")
finally:
    cursor.close()
    conn.close()
    client.disconnect()