import sys
sys.path.insert(0, ".")
import os
import numpy as np
import librosa
import soundfile as sf

def analyze_audio_sample(audio_path: str):
    y, sr = librosa.load(audio_path, sr=16000, mono=True)
    duration = len(y) / sr
    if len(y) == 0:
        return None

    # Spectral features
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    mean_centroid = float(np.mean(centroid))
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
    mean_bw = float(np.mean(bandwidth))
    flatness = librosa.feature.spectral_flatness(y=y)[0]
    mean_flatness = float(np.mean(flatness))
    rms = librosa.feature.rms(y=y)[0]
    mean_rms = float(np.mean(rms))
    max_rms = float(np.max(rms))
    zcr = librosa.feature.zero_crossing_rate(y=y)[0]
    mean_zcr = float(np.mean(zcr))

    # Low vs High energy ratio (split at 1500 Hz)
    S = np.abs(librosa.stft(y, n_fft=1024, hop_length=512))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=1024)
    low_mask = freqs < 1500
    high_mask = freqs >= 1500
    low_energy = float(np.sum(S[low_mask, :]))
    high_energy = float(np.sum(S[high_mask, :]))
    total_energy = low_energy + high_energy + 1e-9
    low_ratio = low_energy / total_energy
    high_ratio = high_energy / total_energy

    # Formant / harmonic peak detection
    spec_mean = np.mean(S, axis=1)
    peak_indices = np.argsort(spec_mean)[::-1][:5]
    top_freqs = sorted([float(freqs[idx]) for idx in peak_indices if spec_mean[idx] > 0.05 * np.max(spec_mean)])

    human_pitch_mask = (freqs >= 80) & (freqs <= 300)
    human_pitch_ratio = float(np.sum(S[human_pitch_mask, :])) / total_energy
    crow_f0_mask = (freqs >= 480) & (freqs <= 950)
    crow_f0_ratio = float(np.sum(S[crow_f0_mask, :])) / total_energy

    print(f"\n--- File: {os.path.basename(audio_path)} ---")
    print(f"  Duration: {duration:.2f}s | Mean Centroid: {mean_centroid:.1f} Hz | Bandwidth: {mean_bw:.1f} Hz")
    print(f"  Flatness: {mean_flatness:.4f} | Mean RMS: {mean_rms:.4f} | Max RMS: {max_rms:.4f} | ZCR: {mean_zcr:.4f}")
    print(f"  Human Pitch Ratio (80-300Hz): {human_pitch_ratio:.1%} | Crow F0 Ratio (480-950Hz): {crow_f0_ratio:.1%}")
    print(f"  Low Energy (<1.5kHz): {low_ratio:.1%} | High Energy (>=1.5kHz): {high_ratio:.1%}")
    print(f"  Top Harmonic Frequencies: {top_freqs}")

for fname in os.listdir("test_audio"):
    if fname.endswith(".wav"):
        analyze_audio_sample(os.path.join("test_audio", fname))
