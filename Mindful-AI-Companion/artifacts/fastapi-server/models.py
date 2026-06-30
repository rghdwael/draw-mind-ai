from sqlalchemy.orm import relationship # 👈 Make sure this is imported at the top!
from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Float, JSON
from database import Base
from pydantic import BaseModel
from datetime import datetime
import tensorflow as tf

@tf.keras.utils.register_keras_serializable()
class SimAM(tf.keras.layers.Layer):
    def __init__(self, e_lambda=1e-4, **kwargs):
        super(SimAM, self).__init__(**kwargs)
        self.e_lambda = e_lambda

    def call(self, x):
        shape = tf.shape(x)
        h, w = tf.gather(shape, 1), tf.gather(shape, 2)
        n = tf.cast(h * w - 1, tf.float32)
        spatial_axes = (1, 2)
        mu = tf.reduce_mean(x, axis=spatial_axes, keepdims=True)
        sq_diff = tf.square(x - mu)
        var = tf.reduce_sum(sq_diff, axis=spatial_axes, keepdims=True) / n
        d = sq_diff / (4.0 * (var + self.e_lambda)) + 0.5
        return x * tf.keras.activations.sigmoid(d)

    def get_config(self):
        config = super(SimAM, self).get_config()
        config.update({"e_lambda": self.e_lambda})
        return config
# ==============================================================================
# 1. SQLAlchemy Database Models (Neon Tables)
# ==============================================================================

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    user_role = Column(String(50))
    password_hash = Column(String(255))
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Child(Base):
    __tablename__ = "children"
    child_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    child_name = Column(String(100))
    age = Column(Integer)
    gender = Column(String(20))
    icon = Column(String, default="happy-outline") 
    avatar_color = Column(String,default='#A78BFA')
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Drawing(Base):
    __tablename__ = "drawings"
    drawing_id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id"))
    image_path = Column(String)
    parent_explanation = Column(String)
    child_description = Column(String, nullable=True) 
    status = Column(String(50), default="pending")
    upload_date = Column(TIMESTAMP, default=datetime.utcnow)

    # 🚀 The Magic Link: Lets you easily grab the AI results attached to this drawing
    emotion_result = relationship("EmotionResult", back_populates="drawing", uselist=False, cascade="all, delete", passive_deletes=True)

class EmotionResult(Base):
    __tablename__ = "emotion_results"
    result_id = Column(Integer, primary_key=True, index=True)
    # Match Neon: UNIQUE and NOT NULL
    drawing_id = Column(Integer, ForeignKey("drawings.drawing_id", ondelete="CASCADE"), unique=True, nullable=False)
    predicted_emotion = Column(String(255), nullable=False)
    confidence_score = Column(Float)
    analysis_date = Column(TIMESTAMP, default=datetime.utcnow)
    model_version = Column(String(50))

    # Relationships to connect everything together
    drawing = relationship("Drawing", back_populates="emotion_result")
    explanation = relationship("Explanation", back_populates="emotion", uselist=False, cascade="all, delete", passive_deletes=True)
    suggestions = relationship("Suggestion", back_populates="emotion", cascade="all, delete", passive_deletes=True)
    
class Explanation(Base):
    __tablename__ = "explanations"
    explanation_id = Column(Integer, primary_key=True, index=True)
    # Match Neon: UNIQUE and NOT NULL
    result_id = Column(Integer, ForeignKey("emotion_results.result_id", ondelete="CASCADE"), unique=True, nullable=False)
    explanation_text = Column(Text, nullable=False)
    visual_features = Column(Text)
    positive_signs = Column(JSON)
    concern_signs = Column(JSON)
    emotion = relationship("EmotionResult", back_populates="explanation")


class Suggestion(Base):
    __tablename__ = "suggestions"
    suggestion_id = Column(Integer, primary_key=True, index=True)
    # Match Neon: NOT NULL (but NOT unique, because we have multiple suggestions per result)
    result_id = Column(Integer, ForeignKey("emotion_results.result_id", ondelete="CASCADE"), nullable=False)
    suggestion_text = Column(Text, nullable=False)

    emotion = relationship("EmotionResult", back_populates="suggestions")


# ==============================================================================
# 2. Pydantic Schemas (Data Validation)
# ==============================================================================

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ChildCreate(BaseModel):
    user_email: str
    child_name: str
    age: int
    gender: str
    # 🚨 ADD THESE TWO LINES:
    icon: str = "happy-outline"
    avatar_color: str = '#A78BFA'

class ChildUpdate(BaseModel):
    child_name: str
    age: int
    gender: str
    icon: str = "happy-outline"
    avatar_color: str = '#A78BFA'

class DrawingCreate(BaseModel):
    child_id: int
    image_path: str
    parent_explanation: str = ""
    status: str = "analyzed"