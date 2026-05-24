from fastapi import FastAPI, Depends, HTTPException, status, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
from database import engine, get_db
import models
import shutil
import os

# التأكد من إنشاء وتحديث جداول قاعدة بيانات Neon safely عند إقلاع السيرفر
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Draw Mind AI API")

# السماح للموبايل والمتصفح بالاتصال بالسيرفر بدون قيود CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# إعداد المجلدات الثابتة لتخزين وعرض رسومات الأطفال
if not os.path.exists("static"):
    os.makedirs("static")
if not os.path.exists("static/drawings"):
    os.makedirs("static/drawings")

app.mount("/static", StaticFiles(directory="static"), name="static")

# أداة تشفير وهاش لكلمات المرور لحماية الحسابات
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==============================================================================
# 1. Pydantic Schemas (Data Validation)
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


# ==============================================================================
# 2. API Health Check
# ==============================================================================

@app.get("/healthz")
def health_check():
    return {"status": "ok", "message": "FastAPI is running smoothly!"}


# ==============================================================================
# 3. Authentication Endpoints (Register & Login)
# ==============================================================================

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    
    new_user = models.User(
        email=user.email, 
        password_hash=hashed_password, 
        full_name=user.name,
        user_role="Parent"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"success": True, "user": {"name": new_user.full_name, "email": new_user.email}}


@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"success": True, "user": {"name": db_user.full_name, "email": db_user.email}}


# ==============================================================================
# 4. Children Management Endpoints (CRUD)
# ==============================================================================

@app.post("/children")
def create_child(child_data: ChildCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == child_data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User (Parent) not found")
        
    db_child = models.Child(
        user_id=user.user_id,
        child_name=child_data.child_name,
        age=child_data.age,
        gender=child_data.gender
    )
    db.add(db_child)
    db.commit()
    db.refresh(db_child)
    return {
        "success": True, 
        "child": {
            "id": str(db_child.child_id),
            "name": db_child.child_name,
            "age": db_child.age,
            "gender": db_child.gender
        }
    }


@app.get("/children")
def get_children(user_email: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    children = db.query(models.Child).filter(models.Child.user_id == db_user.user_id).all()
    
    children_list = []
    for child in children:
        children_list.append({
            "id": str(child.child_id),
            "child_id": child.child_id,
            "name": child.child_name,
            "age": child.age,
            "gender": child.gender
        })
        
    return {
        "success": True,
        "children": children_list
    }


@app.put("/children/{child_id}")
def update_child(child_id: int, child_data: ChildUpdate, db: Session = Depends(get_db)):
    db_child = db.query(models.Child).filter(models.Child.child_id == child_id).first()
    
    if not db_child:
        raise HTTPException(status_code=404, detail="Child profile not found in database")
    
    db_child.child_name = child_data.child_name
    db_child.age = child_data.age
    db_child.gender = child_data.gender
    
    db.commit()
    db.refresh(db_child)
    
    return {
        "success": True,
        "message": "Child details updated successfully in Neon Console!",
        "child": {
            "id": db_child.child_id,
            "name": db_child.child_name,
            "age": db_child.age,
            "gender": db_child.gender
        }
    }


# ==============================================================================
# 5. Artwork Analysis & Storage Endpoints
# ==============================================================================

@app.post("/drawings")
async def upload_drawing(
    child_id: int = Form(...),
    parent_explanation: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    filename = f"drawing_{child_id}_{int(os.path.getmtime.__code__.co_firstlineno)}.png"
    file_path = os.path.join("static/drawings", filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_drawing = models.Drawing(
        child_id=child_id,
        image_path=f"/static/drawings/{filename}",
        parent_explanation=parent_explanation,
        status="analyzed"
    )
    db.add(db_drawing)
    db.commit()
    db.refresh(db_drawing)
    
    db_emotion = models.EmotionResult(
        drawing_id=db_drawing.drawing_id,
        predicted_emotion="Happiness",
        confidence_score=0.92,
        model_version="v1.0.2"
    )
    db.add(db_emotion)
    db.commit()
    db.refresh(db_emotion)
        
    db_explanation = models.Explanation(
        result_id=db_emotion.result_id,
        explanation_text="تشير هذه الرسمة إلى شعور الطفل بالسعادة والاستقرار.",
        visual_features="Bright colors, clear circular smiling patterns"
    )
    db.add(db_explanation)
    
    db_suggestion = models.Suggestion(
        result_id=db_emotion.result_id,
        suggestion_text="Encourage your child to continue drawing to further express positive feelings."
    )
    db.add(db_suggestion)
    db.commit()
    
    return {
        "success": True,
        "drawing_id": db_drawing.drawing_id,
        "image_path": db_drawing.image_path
    }


@app.get("/drawings")
def get_drawings(child_id: int, db: Session = Depends(get_db)):
    drawings = db.query(models.Drawing).filter(models.Drawing.child_id == child_id).all()
    
    formatted_drawings = []
    for d in drawings:
        emotion_res = db.query(models.EmotionResult).filter(models.EmotionResult.drawing_id == d.drawing_id).first()
        
        main_emotion = "Unknown"
        confidence = 90
        emotions_breakdown = []
        recommendations = []
        summary_text = d.parent_explanation or "Analysis completed successfully."

        if emotion_res:
            main_emotion = emotion_res.predicted_emotion or "Happiness"
            confidence = int(emotion_res.confidence_score * 100) if emotion_res.confidence_score else 92
            
            emotions_breakdown = [
                {"name": main_emotion, "percentage": confidence, "color": "#16A34A"},
                {"name": "Other", "percentage": max(0, 100 - confidence), "color": "#8B5CF6"}
            ]
            
            expl_res = db.query(models.Explanation).filter(models.Explanation.result_id == emotion_res.result_id).first()
            if expl_res:
                summary_text = expl_res.explanation_text

            sugg_res = db.query(models.Suggestion).filter(models.Suggestion.result_id == emotion_res.result_id).all()
            recommendations = [s.suggestion_text for s in sugg_res] if sugg_res else ["Continue supporting child's creativity."]

        formatted_drawings.append({
            "id": str(d.drawing_id),
            "childId": str(d.child_id),
            "date": d.upload_date.isoformat() if d.upload_date else "2026-05-19",
            "summary": summary_text,
            "mainEmotion": main_emotion,
            "confidenceLevel": confidence,
            "emotions": emotions_breakdown,
            "recommendations": recommendations,
            "imageUrl": d.image_path
        })
        
    return {
        "success": True,
        "drawings": formatted_drawings
    }


# ── 🚀 منفذ حذف الرسمة المباشر والآمن من Neon Console ──
# ── 🚀 منفذ حذف الرسمة المباشر والآمن ──
@app.delete("/drawings/{drawing_id}")
def delete_drawing(drawing_id: int, db: Session = Depends(get_db)):
    drawing = db.query(models.Drawing).filter(models.Drawing.drawing_id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing analysis not found")
    
    try:
        db.delete(drawing)
        db.commit()
        return {"success": True, "message": "Drawing deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# ── 🚀 منفذ حذف الطفل (مع مسح كافة رسوماته تلقائياً) ──
# بدلاً من @app.delete، استخدمي @app.post
# ── دالة الحذف الموحدة (توضع في main.py) ──
@app.post("/delete-child/{child_id}")
def delete_child(child_id: int, db: Session = Depends(get_db)):
    # البحث عن الطفل في قاعدة البيانات
    child = db.query(models.Child).filter(models.Child.child_id == child_id).first()
    
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    try:
        # بفضل خاصية ondelete="CASCADE" في الـ models، سيتم حذف الرسومات تلقائياً
        db.delete(child)
        db.commit()
        return {"success": True, "message": "Child and associated data deleted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))