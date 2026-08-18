import sys
sys.path.insert(0, ".")

print("Testing TFLite parser / ONNX runtime...", flush=True)

try:
    import onnxruntime as ort
    print(f"ONNX Runtime available: {ort.__version__}", flush=True)
except Exception as e:
    print(f"ONNX Runtime error: {e}", flush=True)

# Let's inspect the flatbuffers structure of yamnet.tflite
with open("models/yamnet.tflite", "rb") as f:
    header = f.read(16)
    print("Header:", header, flush=True)
