from sqlalchemy import Column, Integer, String, TIMESTAMP, ForeignKey, Text, Float
from database import Base
from pydantic import BaseModel
from datetime import datetime

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
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

class Drawing(Base):
    __tablename__ = "drawings"
    drawing_id = Column(Integer, primary_key=True, index=True)
    child_id = Column(Integer, ForeignKey("children.child_id"))
    image_path = Column(String)
    parent_explanation = Column(String)
    status = Column(String(50), default="pending")
    upload_date = Column(TIMESTAMP, default=datetime.utcnow)

class EmotionResult(Base):
    __tablename__ = "emotion_results"
    result_id = Column(Integer, primary_key=True, index=True)
    # 💡 أضفنا ondelete="CASCADE" لحذف نتائج العواطف تلقائياً عند مسح الرسمة
    drawing_id = Column(Integer, ForeignKey("drawings.drawing_id", ondelete="CASCADE"))
    predicted_emotion = Column(String(50))
    confidence_score = Column(Float)
    analysis_date = Column(TIMESTAMP, default=datetime.utcnow)
    model_version = Column(String(50))

class Explanation(Base):
    __tablename__ = "explanations"
    explanation_id = Column(Integer, primary_key=True, index=True)
    # 💡 أضفنا ondelete="CASCADE" لحذف التفسير التلقائي التابع للرسمة المحذوفة
    result_id = Column(Integer, ForeignKey("emotion_results.result_id", ondelete="CASCADE"))
    explanation_text = Column(Text)
    visual_features = Column(Text)

class Suggestion(Base):
    __tablename__ = "suggestions"
    suggestion_id = Column(Integer, primary_key=True, index=True)
    # 💡 أضفنا ondelete="CASCADE" لحذف التوصيات التابعة للرسمة المحذوفة
    result_id = Column(Integer, ForeignKey("emotion_results.result_id", ondelete="CASCADE"))
    suggestion_text = Column(Text)


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

class ChildUpdate(BaseModel):
    child_name: str
    age: int
    gender: str

class DrawingCreate(BaseModel):
    child_id: int
    image_path: str
    parent_explanation: str = ""
    status: str = "analyzed"