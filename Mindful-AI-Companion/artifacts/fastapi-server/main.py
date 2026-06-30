from dotenv import load_dotenv
load_dotenv() 
import ai_helpers
import os
import shutil
import time
import uvicorn
from fastapi import Depends, FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
from pydantic import BaseModel
import models
from database import engine, get_db
from ai_service import ai_engine
import traceback

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
class ChildCreate(BaseModel):
    user_email: str
    child_name: str
    age: int
    gender: str
    icon: str = "happy-outline"       # 👈 Tell FastAPI to expect the icon
    avatar_color: str = "#6C4DFF"

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
    return {"success": True, "user": {"name": db_user.full_name, "email": db_user.email,"id": db_user.user_id}}

import os
from pathlib import Path

@app.post("/drawings")
def upload_drawing(  # <-- REMOVED 'async'
    child_id: int = Form(...),
    parent_explanation: str = Form("No context provided."),
    child_description: str = Form("No context provided."),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # 1. Define and create the directory
        upload_dir = Path("static/drawings")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"child_{child_id}_{int(time.time())}.png"
        file_path = upload_dir / filename
        
        # 2. SAVE THE FILE FIRST
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"🚀 File saved to {file_path}. Starting AI analysis...")
        
        # 3. RUN THE AI ANALYSIS
        analysis_result = ai_engine.analyze(
            str(file_path), 
            {
                "parent_text": parent_explanation, 
                "child_text": child_description
            }
        )
        
        print("✅ AI analysis finished. Saving to database...")
        
        # 4. SAVE TO DATABASE
        # A. Save the Drawing First
        db_drawing = models.Drawing(
            child_id=child_id,
            image_path=f"/static/drawings/{filename}",
            parent_explanation=parent_explanation,
            child_description=child_description,
            status="analyzed"
            # 🚨 Removed the 'analysis' column here!
        )
        db.add(db_drawing)
        db.commit()
        db.refresh(db_drawing) # Get the generated drawing_id
        
        # B. Save the Emotion Result
        new_result = models.EmotionResult(
            drawing_id=db_drawing.drawing_id, # 👈 Links to the drawing!
            predicted_emotion=analysis_result.get("emotional_status", "Pending"),
            confidence_score=0.9, # Adjust if you have actual confidence floats
            model_version="1.0"
        )
        db.add(new_result)
        db.commit() 
        db.refresh(new_result) # Get the generated result_id
        
        # C. Save the Explanation
        new_explanation = models.Explanation(
            result_id=new_result.result_id, # 👈 Links to the emotion result!
            explanation_text=analysis_result.get("explanation", ""),
            visual_features=analysis_result.get("what_model_focused_on", ""),
            positive_signs=analysis_result.get("positive_signs", []), # 👈 Catch positive signs
            concern_signs=analysis_result.get("concern_signs", [])
        )
        db.add(new_explanation)

        # D. Save the Suggestions (Looping through the array)
        for sug_text in analysis_result.get("suggestions", []):
            new_sug = models.Suggestion(
                result_id=new_result.result_id, # 👈 Links to the emotion result!
                suggestion_text=sug_text
            )
            db.add(new_sug)

        db.commit() # Save Explanations and Suggestions to the DB!
        
        # 5. RETURN SUCCESS
        
    
        return {
            "success": True, 
            "image_path": db_drawing.image_path, 
            "drawing_id": db_drawing.drawing_id, 
            "analysis": analysis_result
        }

    except Exception as e:
        # MAGIC DEBUGGER: This will catch the crash and show it in Swagger!
        error_details = traceback.format_exc()
        print("\n❌ FATAL ERROR OCCURRED:\n", error_details)
        return {
            "success": False, 
            "error_message": str(e),
            "full_traceback": error_details
        }
@app.get("/drawings")
def get_drawings(child_id: int, db: Session = Depends(get_db)):
    # 🚨 Magic Trick: joinedload automatically fetches all linked data in one query!
    drawings = db.query(models.Drawing).options(
        joinedload(models.Drawing.emotion_result)
    ).filter(models.Drawing.child_id == child_id).all()
    
    formatted = []
    for d in drawings:
        # Rebuild the Groq dictionary from the database rows
        analysis_data = None
        if d.emotion_result:
            analysis_data = {
                "emotional_status": d.emotion_result.predicted_emotion,
                "confidence_level": "High" if d.emotion_result.confidence_score > 0.8 else "Moderate",
                "explanation": d.emotion_result.explanation.explanation_text if d.emotion_result.explanation else "",
                "what_model_focused_on": d.emotion_result.explanation.visual_features if d.emotion_result.explanation else "",
                "positive_signs": d.emotion_result.explanation.positive_signs if d.emotion_result.explanation else [],
                "concern_signs": d.emotion_result.explanation.concern_signs if d.emotion_result.explanation else [],
                "suggestions": [s.suggestion_text for s in d.emotion_result.suggestions],
            }

        formatted.append({
            "id": str(d.drawing_id), 
            "imageUrl": d.image_path,
            "summary": d.parent_explanation,
            "analysis": analysis_data # 👈 Now sends the rebuilt dictionary!
        })
        
    return {"success": True, "drawings": formatted}

@app.delete("/drawings/{drawing_id}")
def delete_drawing(drawing_id: int, db: Session = Depends(get_db)):
    # 1. Find the drawing
    db_drawing = db.query(models.Drawing).filter(models.Drawing.drawing_id == drawing_id).first()
    
    if not db_drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")
    
    # 2. Delete it (Cascade will automatically delete related AI data!)
    db.delete(db_drawing)
    db.commit()
    
    return {"success": True, "message": "Drawing deleted successfully"}

@app.post("/children")
def add_child(child: ChildCreate, db: Session = Depends(get_db)):
    # 1. Find the parent user by email
    db_user = db.query(models.User).filter(models.User.email == child.user_email).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Create the child linked to this user
    db_child = models.Child(
        user_id=db_user.user_id,
        child_name=child.child_name,
        age=child.age,
        gender=child.gender,
        icon=child.icon,
        avatar_color=child.avatar_color
    )
    db.add(db_child)
    db.commit()
    db.refresh(db_child) # Get the newly created ID
    
    # 3. Return it to the frontend
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
    
    # جلب قائمة الأطفال التابعين لهذا المستخدم
    children = db.query(models.Child).filter(models.Child.user_id == db_user.user_id).all()
    
    formatted_children = [{"id": str(c.child_id), "name": c.child_name, "age": c.age, "gender": c.gender} for c in children]
    return {"success": True, "children": formatted_children}

from typing import Optional
from groq import Groq

# 1. Back to using user_email
class ChatRequest(BaseModel):
    message: str
    child_id: Optional[int] = None
    user_email: str 

@app.post("/api/chat")
def chat_with_ai(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        context_str = "No specific child selected. Answer generally based on expert child psychology."

        db_user = db.query(models.User).filter(models.User.email == request.user_email).first()

        # SCENARIO A: The parent selected ONE specific child
        if request.child_id:
            db_child = db.query(models.Child).filter(models.Child.child_id == request.child_id).first()
            if db_child:
                # 🚨 FIXED: Sorting by drawing_id instead of created_at
                drawings = db.query(models.Drawing).options(
                    joinedload(models.Drawing.emotion_result)
                ).filter(models.Drawing.child_id == request.child_id).order_by(models.Drawing.drawing_id.desc()).limit(5).all()

                context_str = f"Child Name: {db_child.child_name}, Age: {db_child.age}, Gender: {db_child.gender}\n\nRecent Drawing Analyses:\n"
                if not drawings:
                    context_str += "No drawings uploaded yet.\n"
                else:
                    for i, d in enumerate(drawings):
                        if d.emotion_result:
                            context_str += f"- Drawing {i+1}: Emotion: {d.emotion_result.predicted_emotion}. "
                            if d.emotion_result.explanation:
                                context_str += f"Focus: {d.emotion_result.explanation.visual_features}. Notes: {d.emotion_result.explanation.explanation_text}\n"

        # SCENARIO B: No child selected -> FAMILY SCAN
        elif db_user:
            children = db.query(models.Child).filter(models.Child.user_id == db_user.user_id).all()
            context_str = "FAMILY OVERVIEW (Compare all children below):\n\n"
            
            if not children:
                context_str += "No children registered yet.\n"
            else:
                for child in children:
                    context_str += f"--- Child: {child.child_name} (Age: {child.age}) ---\n"
                    
                    # 🚨 FIXED: Sorting by drawing_id here too
                    drawings = db.query(models.Drawing).options(
                        joinedload(models.Drawing.emotion_result)
                    ).filter(models.Drawing.child_id == child.child_id).order_by(models.Drawing.drawing_id.desc()).limit(3).all()
                    
                    if not drawings:
                        context_str += "  No drawings uploaded yet.\n"
                    else:
                        for i, d in enumerate(drawings):
                            if d.emotion_result:
                                context_str += f"  - Emotion: {d.emotion_result.predicted_emotion}. "
                                if d.emotion_result.explanation:
                                    context_str += f"Notes: {d.emotion_result.explanation.explanation_text}\n"
                    context_str += "\n"

        system_prompt = f"""
        You are 'Draw Mind AI', a professional, clinical child psychology AI assistant.
        
        CRITICAL RULES:
        1. Respond in ENGLISH ONLY.
        2. ALWAYS read the CLINICAL CONTEXT below. It contains the real database records of the user's children.
        3. If the user asks ANY question about their children (e.g., "what can you see", "how are they", "who needs help"), use the FAMILY OVERVIEW data to answer them thoroughly.
        4. NEVER say you don't have information if the CLINICAL CONTEXT contains data.
        5. Identify concerning emotions or highlight positive signs based on the data.

        CLINICAL CONTEXT:
        {context_str}
        """

        print("\n" + "="*40)
        print("🧠 WHAT THE AI SEES (CONTEXT_STR):")
        print(context_str)
        print("="*40 + "\n")

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3, 
        )

        ai_reply = chat_completion.choices[0].message.content
        return {"success": True, "reply": ai_reply}

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"❌ Chat Error: {error_details}")
        return {"success": False, "detail": str(e)}

# This MUST be the very last thing in the file
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
