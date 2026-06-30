import cv2
import numpy as np
import tensorflow as tf
import json

@tf.keras.utils.register_keras_serializable()
class SimAM(tf.keras.layers.Layer):
    def __init__(self, e_lambda=1e-4, **kwargs):
        super().__init__(**kwargs)
        self.e_lambda = e_lambda

    def call(self, x):
        shape = tf.shape(x)
        h, w  = tf.gather(shape, 1), tf.gather(shape, 2)
        n     = tf.cast(h * w - 1, tf.float32)
        mu    = tf.reduce_mean(x, axis=(1, 2), keepdims=True)
        sq    = tf.square(x - mu)
        var   = tf.reduce_sum(sq, axis=(1, 2), keepdims=True) / n
        d     = sq / (4.0 * (var + self.e_lambda)) + 0.5
        return x * tf.keras.activations.sigmoid(d)

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"e_lambda": self.e_lambda})
        return cfg

# Colab Constants
NOT_SURE_THRESHOLD = 5.0
ABSOLUTE_SAD_THRESHOLD = 70.0
DIFFERENCE_THRESHOLD = 15.0
SAD_AF_BLEND_THRESHOLD = 15.0

def preprocess(img_rgb):
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
    img = cv2.resize(img_rgb, (224, 224))
    img = cv2.bilateralFilter(img, d=5, sigmaColor=50, sigmaSpace=50)
    img = cv2.filter2D(img, -1, np.array([[0,-0.5,0],[-0.5,3.0,-0.5],[0,-0.5,0]]))
    img = np.clip(img, 0, 255).astype(np.float32)
    return preprocess_input(img)

def decide(probs):
    ph = probs['Happy']*100; ps = probs['Sad']*100
    pa = probs['Angry']*100; pf = probs['Fear']*100
    gap = abs(ph - ps)
    
    if gap <= NOT_SURE_THRESHOLD:             
        return "Not Sure", (ph+ps)/2, None
    if ph > ps:                               
        return "Happy", ph, None
    if ps >= ABSOLUTE_SAD_THRESHOLD:          
        return "Sad", ps, None
        
    max_af = max(pa, pf)
    af_class = "Angry" if pa > pf else "Fear"
    
    if abs(ps - max_af) <= SAD_AF_BLEND_THRESHOLD: 
        return f"Sad + {af_class}", (ps+max_af)/2, af_class
    if (ps - max_af) > DIFFERENCE_THRESHOLD:  
        return "Sad", ps, None
        
    return af_class, max_af, None

def get_friendly_emotion(raw_emotion):
    mapping = {
        "Happy": "Positive Emotions: Joyful/Happiness",
        "Sad": "Negative Emotions: Sadness",
        "Angry": "Negative Emotions: Angriness/Frustration",
        "Fear": "Negative Emotions: Fearness/scariness",
        "Sad + Angry": "Negative Emotions: A mix of Sadness and Anger",
        "Sad + Fear": "Negative Emotions: A mix of Sadness, fear and anxiety",
        "Not Sure": "Mixed Emotions: A mix of different, unclear feelings"
    }
    return mapping.get(raw_emotion, raw_emotion)

def extract_features(img_rgb):
    """Extracts psychological visual clues from the drawing."""
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    total_pixels = gray.size

    brightness = round(float(np.mean(gray)), 2)
    contrast = round(float(np.std(gray)), 2)

    edges = cv2.Canny(gray, 100, 200)
    edge_pixels = np.sum(edges > 0)
    edge_density = round(float(edge_pixels / total_pixels), 4)

    _, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        x_min = min([cv2.boundingRect(c)[0] for c in contours])
        y_min = min([cv2.boundingRect(c)[1] for c in contours])
        x_max = max([cv2.boundingRect(c)[0] + cv2.boundingRect(c)[2] for c in contours])
        y_max = max([cv2.boundingRect(c)[1] + cv2.boundingRect(c)[3] for c in contours])
        used_area = (x_max - x_min) * (y_max - y_min)
        canvas_usage = round(float(used_area / total_pixels), 2)
    else:
        canvas_usage = 0.0

    corners = cv2.goodFeaturesToTrack(gray, maxCorners=500, qualityLevel=0.01, minDistance=10)
    num_corners = len(corners) if corners is not None else 0
    sharpness_ratio = round(float(num_corners / (edge_pixels + 1)) * 1000, 2)

    r, g, b = cv2.split(img_rgb)
    red_pixels = np.sum((r > 150) & (g < 100) & (b < 100)) / total_pixels
    dark_pixels = np.sum(gray < 50) / total_pixels

    color_tone = "Neutral/Varied"
    if red_pixels > 0.03:
        color_tone = "High Red Tones (Often linked to high energy, anger, or urgency)"
    elif dark_pixels > 0.10:
        color_tone = "Heavy Dark/Black Strokes (Often linked to fear, sadness, or intensity)"
    elif brightness > 220:
        color_tone = "Very Light/Faint Strokes (Often linked to timidity or low confidence)"

    return {
        'brightness': brightness,
        'contrast': contrast,
        'edge_density': edge_density,
        'canvas_usage': canvas_usage,
        'sharpness_ratio': sharpness_ratio,
        'dominant_tone': color_tone
    }

def gradcam_single(model, img_pre):
    inp = tf.cast(np.expand_dims(img_pre, 0), tf.float32)
    backbone = next((l for l in model.layers if 'mobilenetv2' in l.name.lower()), None)
    target_conv = next((l for l in reversed(backbone.layers) if isinstance(l, tf.keras.layers.Conv2D)), None)
    feat_extractor = tf.keras.Model(inputs=backbone.input, outputs=target_conv.output)

    with tf.GradientTape() as tape:
        conv_out = feat_extractor(inp, training=False)
        tape.watch(conv_out)
        x = conv_out
        after_backbone = False
        for layer in model.layers:
            if after_backbone:
                x = layer(x, training=False)
            if layer.name == backbone.name:
                after_backbone = True
        preds = x
        loss = preds[:, np.argmax(preds[0])]

    grads = tape.gradient(loss, conv_out)
    pooled = tf.reduce_mean(grads, axis=(0,1,2)) if grads is not None else tf.ones(conv_out.shape[-1], dtype=tf.float32)

    heatmap = tf.reduce_sum(conv_out[0] * pooled, axis=-1).numpy()
    heatmap = np.maximum(heatmap, 0)
    if np.max(heatmap) > 0:
        heatmap /= np.max(heatmap)
    return heatmap

def gradcam_merged(hs_model, af_model, img_pre, probs):
    h_hs = gradcam_single(hs_model, img_pre)
    if probs.get('model2_ran'):
        h_af = gradcam_single(af_model, img_pre)
        t = np.max(h_hs) + np.max(h_af) + 1e-8
        merged = (np.max(h_hs)/t)*h_hs + (np.max(h_af)/t)*cv2.resize(h_af, (h_hs.shape[1], h_hs.shape[0]))
    else:
        merged = h_hs
    if np.max(merged) > 0:
        merged /= np.max(merged)
    return merged

def heatmap_desc(heatmap):
    thirds = np.array_split(heatmap, 3, axis=1)
    halves = np.array_split(heatmap, 2, axis=0)
    scores = {'left': float(np.mean(thirds[0])), 'center': float(np.mean(thirds[1])), 'right': float(np.mean(thirds[2])),
              'top': float(np.mean(halves[0])), 'bottom': float(np.mean(halves[1]))}
    top = max(scores, key=scores.get)
    intens = "high" if np.max(heatmap)>0.7 else "moderate" if np.max(heatmap)>0.4 else "low"
    return (f"Model focused most on the {top} region with {intens} activation. Scores — " + 
            ", ".join(f"{k}:{v:.2f}" for k,v in scores.items())), scores


def call_groq(friendly_emotion, probs, features, gradcam_d, metadata, is_ambiguous, client):
    # 1. Safely extract metadata with fallbacks
    parent_text = metadata.get('parent_text') or metadata.get('parent_explanation') or "No context provided by parent."
    child_text = metadata.get('child_text') or metadata.get('child_description') or "No context provided by child."
    
    # 2. DEBUG: Verify the data reached the helper file before sending to Groq
    print(f"DEBUG: Data sent to Groq -> Parent: '{parent_text}', Child: '{child_text}'")

    prompt = f"""
You are an expert child psychologist analyzing a child's drawing.

FINAL DETECTED EMOTION: {friendly_emotion}

RAW SCORES:
- Happy: {probs['Happy']*100:.1f}%
- Sad:   {probs['Sad']*100:.1f}%
- Angry: {probs['Angry']*100:.1f}%
- Fear:  {probs['Fear']*100:.1f}%

GRADCAM FOCUS: {gradcam_d}

PSYCHOLOGICAL VISUAL FEATURES:
- Canvas Usage: {features['canvas_usage']*100:.1f}%
- Color Tone: {features['dominant_tone']}
- Stroke Sharpness: {features['sharpness_ratio']}
- Edge Density: {features['edge_density']*100:.2f}%
- Brightness: {features['brightness']} | Contrast: {features['contrast']}

CHILD & PARENT CONTEXT:
- Child age: {metadata.get('age','Unknown')}
- Parent notes: "{parent_text}"
- Child words: "{child_text}"

YOUR TASK:
You are an expert child psychologist. You have been provided with specific context from the parent and the child. 
MANDATORY: You must write a paragraph titled "Contextual Analysis" where you explicitly link the parent's notes: "{parent_text}" and the child's words: "{child_text}" to the visual features of the drawing. If you do not mention these specific notes in your JSON output, the analysis is considered invalid.

Use the Psychological Visual Features to thoroughly explain WHY the model made its prediction. Do NOT mention specific objects (like suns, kites, or people), but focus entirely on the psychology of the colors, space usage, and stroke sharpness.
Be warm, clear, and supportive. Never make clinical diagnoses.

Return ONLY valid JSON. The JSON must have these exact keys:
"emotional_status", "confidence_level", "explanation", "what_model_focused_on", "positive_signs" (list), "concern_signs" (list), "suggestions" (list), "professional_note".
"""
    try:
        messages = [{"role": "user", "content": prompt}]
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.4,
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"⚠️ Groq error: {e}")
        return {"error": str(e)}