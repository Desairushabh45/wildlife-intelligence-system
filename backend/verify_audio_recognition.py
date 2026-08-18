import sys
sys.path.insert(0, ".")
import os

from app.core.database import SessionLocal
from app.services import detection_service

db = SessionLocal()

test_cases = [
    ("test_audio/test_bird.wav", "birdnet", ["Indian Peafowl", "Bird vocalization"]),
    ("test_audio/test_crow.wav", "birdnet", ["House Crow", "Crow, caw, raven", "Crow"]),
    ("test_audio/test_tiger_roar.wav", "yamnet", ["Bengal Tiger", "Asiatic Lion"]),
    ("test_audio/test_elephant.wav", "yamnet", ["Indian Elephant"]),
    ("test_audio/test_human_speech.wav", "yamnet", ["Human Speech / Voice"]),
    ("test_audio/test_rain.wav", "yamnet", ["Rain & Weather Precipitation", "Environmental Ambient Sound"]),
]

all_passed = True
print("=" * 65)
print("RUNNING WILDLIFE & BIOACOUSTIC AUDIO RECOGNITION TEST SUITE")
print("=" * 65)

for audio_file, expected_source, expected_candidates in test_cases:
    print(f"\nEvaluating: {audio_file}")
    
    bird_dets = detection_service.run_audio_detection(audio_file)
    yam_dets = detection_service.run_yamnet_detection(audio_file)
    
    all_dets = bird_dets + yam_dets
    print(f"  -> BirdNET Detections: {bird_dets}")
    print(f"  -> YAMNet Detections:  {yam_dets}")
    
    found_match = False
    for det in all_dets:
        lbl = det["species_label"]
        conf = det["confidence"]
        src = det["detection_source"]
        species_id = detection_service.resolve_species_id(db, lbl)
        
        print(f"     [Result] Label='{lbl}' | Conf={conf*100:.1f}% | Source={src} | Species_ID={species_id}")
        
        if any(cand.lower() in lbl.lower() for cand in expected_candidates):
            found_match = True
    
    if found_match:
        print(f"  [PASS] Successfully recognized as one of {expected_candidates}")
    else:
        print(f"  [FAIL] Expected one of {expected_candidates}")
        all_passed = False

print("\n" + "=" * 65)
if all_passed:
    print("ALL AUDIO RECOGNITION TESTS PASSED SUCCESSFULLY!")
else:
    print("SOME AUDIO TESTS FAILED.")
print("=" * 65)
