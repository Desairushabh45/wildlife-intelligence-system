import sys
sys.path.insert(0, ".")
import numpy as np
import soundfile as sf
import os

os.makedirs("test_audio", exist_ok=True)
sr = 16000
duration = 3.0
t = np.linspace(0, duration, int(sr * duration), endpoint=False)

# 1. Avian Peafowl call: Proper FM whistle sweep with continuous phase integration
sweep_f = 2400.0 + 1600.0 * (0.5 + 0.5 * np.sin(2 * np.pi * 3.0 * t))
phase = 2 * np.pi * np.cumsum(sweep_f) / sr
bird_audio = (0.6 * np.sin(phase) + 0.3 * np.sin(2 * phase)) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.0 * t))
sf.write("test_audio/test_bird.wav", bird_audio.astype(np.float32), sr)

# 2. Bengal Tiger Roar: Guttural low-frequency roar with integrated phase
roar_f0 = 110.0 + 30.0 * np.sin(2 * np.pi * 1.5 * t)
roar_phase = 2 * np.pi * np.cumsum(roar_f0) / sr
roar_audio = (
    0.6 * np.sin(roar_phase) +
    0.4 * np.sin(2 * roar_phase) +
    0.3 * np.sin(3 * roar_phase)
) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * t))
sf.write("test_audio/test_tiger_roar.wav", roar_audio.astype(np.float32), sr)

# 3. Elephant Rumble: Infrasound rumble (35 - 70 Hz)
elephant_f0 = 40.0 + 15.0 * np.sin(2 * np.pi * 0.5 * t)
elephant_phase = 2 * np.pi * np.cumsum(elephant_f0) / sr
elephant_audio = 0.8 * np.sin(elephant_phase) + 0.3 * np.sin(2 * elephant_phase)
sf.write("test_audio/test_elephant.wav", elephant_audio.astype(np.float32), sr)

# 4. Human Speech: Formants at 140Hz fundamental, 450Hz, 1400Hz, 2400Hz
f0 = 140.0
speech_phase = 2 * np.pi * f0 * t
human_audio = (
    0.5 * np.sin(speech_phase) * np.sin(2 * np.pi * 450 * t) +
    0.35 * np.sin(2 * np.pi * 1400 * t) +
    0.2 * np.sin(2 * np.pi * 2400 * t)
) * (0.6 + 0.4 * np.sin(2 * np.pi * 3.5 * t))
sf.write("test_audio/test_human_speech.wav", human_audio.astype(np.float32), sr)

# 5. Rain: Broadband pink/white noise
noise = np.random.normal(0, 0.15, len(t))
sf.write("test_audio/test_rain.wav", noise.astype(np.float32), sr)

# 6. Crow Caw: Guttural pulsed "caw" (F0 = 650Hz, formants at 1300Hz, 1950Hz)
crow_f0 = 650.0 + 80.0 * np.sin(2 * np.pi * 4.0 * t)
crow_phase = 2 * np.pi * np.cumsum(crow_f0) / sr
caw_envelope = np.clip(np.sin(2 * np.pi * 1.0 * t), 0, 1) ** 0.5
crow_audio = (
    0.6 * np.sin(crow_phase) +
    0.4 * np.sin(2 * crow_phase) +
    0.3 * np.sin(3 * crow_phase) +
    0.15 * np.sin(4 * crow_phase)
) * caw_envelope
sf.write("test_audio/test_crow.wav", crow_audio.astype(np.float32), sr)

print("Generated clean realistic test audio waveforms including Crow caw!")
