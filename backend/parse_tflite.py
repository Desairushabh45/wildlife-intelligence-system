import struct
import numpy as np

print("Testing TFLite buffer parsing...", flush=True)

with open("models/yamnet.tflite", "rb") as f:
    buf = f.read()

print(f"Read {len(buf)} bytes from models/yamnet.tflite", flush=True)
