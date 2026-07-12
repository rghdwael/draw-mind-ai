# DrawMind AI

DrawMind AI is an AI-powered system designed for the preliminary emotional analysis of children's hand-drawn artwork. Developed by a team of university students, the platform translates raw visual features from drawings into interpretable outputs accessible to non-specialist users, such as parents and educators. 

**Disclaimer:** This system is strictly a preliminary analytical tool and does not provide clinical diagnoses, psychiatric assessments, or medical recommendations. It is intended to support, not replace, professional psychological evaluation.

---

## Key Features

*   **Four-Class Emotion Classification:** Classifies children's drawings into four primary emotional categories: happiness, sadness, anger, and fear.
*   **Explainable AI (XAI):** Generates Grad-CAM visual attribution heatmaps to identify the specific regions of the drawing most influential to the model's prediction.
*   **Visual Feature Extraction:** Automatically computes 14 distinct visual properties, including canvas spatial usage, edge density, stroke sharpness, and dominant color tone.
*   **Natural-Language Reports:** Integrates with a Large Language Model (Groq API / Llama-3.3-70b-versatile) to translate raw computer vision metrics and parent notes into structured, easily understandable psychological reports.
*   **Multi-Profile Management:** Allows parents and caregivers to maintain separate profiles for multiple children, tracking emotional trends over time.
*   **Specialist Directory:** Provides an integrated directory of certified child psychologists and mental health professionals for seamless consultation requests.

---

## System Architecture

DrawMind AI utilizes a multi-modal, decoupled architecture to handle complex image processing alongside natural language generation.

### AI & Machine Learning Pipeline
*   **Hierarchical Decision-Logic Module:** To overcome natural dataset imbalances, the system employs a cascading architecture rather than a single multi-class model. 
*   **Base Models:** The pipeline uses two specialized binary classifiers (Happy/Sad and Angry/Fear) built on a **MobileNetV2** backbone.
*   **Attention Mechanism:** The models integrate a custom **SimAM** (Simple, Parameter-Free Attention Module) layer to dynamically focus on locally distinctive stroke patterns without adding heavy parameters.

### Backend & Infrastructure
*   **Framework:** Built with **Python** and **FastAPI** to manage asynchronous file uploads, database queries, and AI inference calls efficiently.
*   **Database:** Utilizes a serverless **PostgreSQL** instance hosted on Neon, managed via SQLAlchemy ORM for strict referential integrity.
*   **Image Processing:** Relies on **OpenCV** for an extensive three-stage "Master Filter" preprocessing pipeline (bilateral filtering, Laplacian sharpening, and tensor normalization).

---

## API Endpoints

The FastAPI backend exposes the following RESTful endpoints to handle the application's core functionality[cite: 1]:

*   `POST /register` & `POST /login`: Handles user account creation and authentication (passwords hashed via bcrypt).
*   `POST /children` & `GET /children`: Manages child profile creation and retrieval linked to parent accounts.
*   `POST /drawings`: Receives drawing uploads, saves them, runs the full CV/AI pipeline (including LLM generation), and commits results to the database.
*   `GET /drawings`: Fetches a child's complete drawing and analysis history using SQLAlchemy joined loads for speed.
*   `DELETE /drawings/{drawing_id}`: Removes a drawing record and cascades the deletion to all associated emotion results and suggestions.
*   `POST /api/chat`: Handles the conversational AI feature to answer user questions based on session history and drawing results.

---

## Testing Strategy

The system's reliability is ensured through a rigorous, three-phase testing methodology:

1.  **Unit Testing:** Verifies isolated database operations, endpoint routing integrity, and mathematical feature extraction outputs.
2.  **Integration Testing:** Ensures smooth data flow between client-to-server file uploads, the Vision-Language Model API pipeline, and Cloud Infrastructure synchronization.
3.  **Usability Testing:** Validates that the front-end interfaces (such as adding child profiles and navigating the specialist directory) are intuitive for non-technical caregivers.

---

## Future Roadmap

We are continuously working to improve DrawMind AI. Planned future updates include:
*   **Longitudinal Tracking:** Developing data visualization dashboards to map a child's emotional trends over extended periods.
*   **On-Device Inference:** Transitioning to TensorFlow Lite for local, offline model inference to enhance speed and user privacy.
*   **Voice Input Modality:** Integrating audio analysis to evaluate the tone and pitch of a child's verbal descriptions alongside their visual artwork.

---

## Repository Structure

The codebase is organized into several primary directories to manage both the backend AI services and the frontend application environments:

*   **`.agents/`**, **`artifacts/`**, **`attached_assets/`**, **`lib/`**, **`scripts/`**: Core directories housing the application logic, AI scripts, and dependencies.
*   **`package.json`** & **`package-lock.json`**: Node package configurations handling frontend dependencies and scripts.
*   **`.env`**, **`.gitignore`**, **`.replit`**, **`.replitignore`**: Environment and deployment configurations for local and cloud hosting setups.

---

## Credits & Acknowledgements

DrawMind AI was researched, designed, and developed by undergraduate students at the **University of Jordan, King Abdullah II School of Information Technology**. 

*   **Student Development Team:** Rahmeh Ibrahim Alfuqahaa, Raghad Wael Alkhudair, Yarah Alhindi, and Mariya Khaled Hammash.
*   **Academic Supervisors:** Dr. Ruba Obeidat and Dr. Dima Suleiman.
