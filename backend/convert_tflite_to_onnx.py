import subprocess
import sys
import os

print("Starting TFLite to ONNX conversion...", flush=True)

cmd = [
    sys.executable, "-m", "tf2onnx.convert",
    "--tflite", "models/yamnet.tflite",
    "--output", "models/yamnet.onnx",
    "--opset", "16"
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", res.stdout, flush=True)
print("STDERR:", res.stderr, flush=True)

if os.path.exists("models/yamnet.onnx"):
    print(f"yamnet.onnx created successfully! Size: {os.path.getsize('models/yamnet.onnx')} bytes", flush=True)
else:
    print("yamnet.onnx conversion failed!", flush=True)
