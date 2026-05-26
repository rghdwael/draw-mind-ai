import os
import shutil
import time
import uvicorn
from fastapi import Depends, FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pydantic import BaseModel
import models
from database import engine, get_db

# 1. تهيئة السيرفر
models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Draw Mind AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. إعداد المجلدات الثابتة
os.makedirs("static/drawings", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 3. Schemas
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    user_role: str = "Parent"

class UserLogin(BaseModel):
    email: str
    password: str

# 4. Endpoints
@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = pwd_context.hash(user.password)
    db_user = models.User(email=user.email, password_hash=hashed, full_name=user.name, user_role=user.user_role)
    db.add(db_user)
    db.commit()
    return {"success": True}

@app.post("/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not pwd_context.verify(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"success": True, "user": {"name": db_user.full_name, "email": db_user.email}}

import os
from pathlib import Path

@app.post("/drawings")
async def upload_drawing(
    child_id: int = Form(...),
    parent_explanation: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. تحديد المسار الكامل للمجلد لضمان عدم حدوث خطأ
    upload_dir = Path("static/drawings")
    upload_dir.mkdir(parents=True, exist_ok=True) # إنشاء المجلد تلقائياً
    
    filename = f"child_{child_id}_{int(time.time())}.png"
    file_path = upload_dir / filename
    
    # 2. الحفظ باستخدام المسار الصحيح
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
    return {"success": True, "image_path": db_drawing.image_path}
@app.get("/drawings")
def get_drawings(child_id: int, db: Session = Depends(get_db)):
    drawings = db.query(models.Drawing).filter(models.Drawing.child_id == child_id).all()
    formatted = [{"id": str(d.drawing_id), "imageUrl": d.image_path, "summary": d.parent_explanation} for d in drawings]
    return {"success": True, "drawings": formatted}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
    # أضيفي هذا الجزء ليعمل تطبيق الموبايل بدون خطأ 404
@app.get("/children")
def get_children(user_email: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # جلب قائمة الأطفال التابعين لهذا المستخدم
    children = db.query(models.Child).filter(models.Child.user_id == db_user.user_id).all()
    
    formatted_children = [{"id": str(c.child_id), "name": c.child_name, "age": c.age, "gender": c.gender} for c in children]
    return {"success": True, "children": formatted_children}