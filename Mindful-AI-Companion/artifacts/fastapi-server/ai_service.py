import os
import cv2
import numpy as np
import tensorflow as tf
from groq import Groq
from ai_helpers import SimAM
original_layer_init = tf.keras.layers.Layer.__init__

def patched_layer_init(self, *args, **kwargs):
    kwargs.pop('quantization_config', None) # Destroy the bad parameter
    original_layer_init(self, *args, **kwargs)

tf.keras.layers.Layer.__init__ = patched_layer_init
# Import everything from the helper file we just created
from ai_helpers import (
    preprocess, extract_features, decide, get_friendly_emotion, 
    gradcam_merged, heatmap_desc, call_groq,
    NOT_SURE_THRESHOLD, ABSOLUTE_SAD_THRESHOLD
)

class AI_Service:
    _instance = None

    def __init__(self):
        self.client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self.model_dir = "models"
        
        # ── Load models EAGERLY at startup — fixes SimAM registration issue ──
        print("⏳ Loading Happy/Sad model...")
        self.happy_sad_model = tf.keras.models.load_model(
            os.path.join(self.model_dir, 'happy_sad_compat.h5'),
            custom_objects={'SimAM': SimAM},
            compile=False
        )
        print("⏳ Loading Angry/Fear model...")
        self.angry_fear_model = tf.keras.models.load_model(
            os.path.join(self.model_dir, 'angry_fear_compat.h5'),
            custom_objects={'SimAM': SimAM},
            compile=False
        )
        print("✅ AI Service: Both models loaded and ready.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance


    # --- 2. The Core Prediction Pipeline ---
    def predict_probs(self, img_pre):
        inp        = np.expand_dims(img_pre, 0)
        hs         = self.happy_sad_model.predict(inp, verbose=0)[0]
        prob_sad   = float(hs[0]) if len(hs) == 1 else float(hs[1])
        prob_happy = 1.0 - prob_sad
        hs_gap     = abs(prob_happy - prob_sad) * 100

        if hs_gap <= NOT_SURE_THRESHOLD:
            return {'Happy': prob_happy, 'Sad': prob_sad, 'Angry': 0.0, 'Fear': 0.0, 'model2_ran': False}
        if prob_happy > prob_sad:
            return {'Happy': prob_happy, 'Sad': prob_sad, 'Angry': 0.0, 'Fear': 0.0, 'model2_ran': False}
        if prob_sad * 100 >= ABSOLUTE_SAD_THRESHOLD:
            return {'Happy': prob_happy, 'Sad': prob_sad, 'Angry': 0.0, 'Fear': 0.0, 'model2_ran': False}

        af = self.angry_fear_model.predict(inp, verbose=0)[0]
        prob_fear  = float(af[0]) if len(af) == 1 else float(af[1])
        prob_angry = 1.0 - prob_fear
        return {'Happy': prob_happy, 'Sad': prob_sad, 'Angry': prob_angry, 'Fear': prob_fear, 'model2_ran': True}

    def analyze(self, image_path, metadata):
        print(f"🔍 Starting Analysis for: {image_path}")

        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            return {"error": "Failed to read the image file."}
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        features       = extract_features(img_rgb)
        img_pre        = preprocess(img_rgb)
        probs          = self.predict_probs(img_pre)
        raw_emotion, confidence, af_blend = decide(probs)
        is_ambiguous   = (raw_emotion == "Not Sure")
        friendly_emotion = get_friendly_emotion(raw_emotion)

        print(f"🎭 Emotion: {raw_emotion} ({confidence:.1f}%)")

        heatmap        = gradcam_merged(self.happy_sad_model, self.angry_fear_model, img_pre, probs)
        gradcam_desc, _ = heatmap_desc(heatmap)  # ← was missing

        report = call_groq(
            friendly_emotion=friendly_emotion,
            probs=probs,
            features=features,
            gradcam_d=gradcam_desc,
            metadata=metadata,
            is_ambiguous=is_ambiguous,
            client=self.client
        )

        print("✅ Analysis Complete!")
        return report
# Initialize the singleton
ai_engine = AI_Service.get_instance()