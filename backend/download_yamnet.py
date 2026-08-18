import urllib.request
import os

urls = [
    "https://github.com/antonyharfield/tflite-models-audioset-yamnet/raw/master/yamnet.tflite",
    "https://huggingface.co/chayuto/yamnet-mel-int8-tflm/resolve/main/yamnet.tflite",
    "https://github.com/snakers4/silero-models/raw/master/models/snakers4_silero-models/latest/silero_vad.onnx"
]

for u in urls:
    filename = u.split("/")[-1]
    dest = os.path.join("models", filename)
    print(f"Trying {u} -> {dest}...", flush=True)
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req) as resp, open(dest, "wb") as f:
            f.write(resp.read())
        print(f"  Success: {dest} ({os.path.getsize(dest)} bytes)", flush=True)
    except Exception as e:
        print(f"  Failed: {e}", flush=True)
