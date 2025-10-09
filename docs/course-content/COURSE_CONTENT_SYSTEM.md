# Course Content Management System - Implementation Guide

## Overview

The LitmusAI platform now includes a complete **Course Content Management System** that allows users to access and complete courses directly within the platform instead of being redirected to external links.

## ✅ What's Been Implemented

### 1. Database Schema

#### New Tables

**`lesson` table:**
- Stores individual lessons within training modules
- Fields: `id`, `module_id`, `title`, `description`, `order_index`, `content_type`, `content` (JSON), `estimated_duration_minutes`, `is_required`, `created_at`
- Content types supported: `video`, `text`, `quiz`, `interactive`

**`lesson_progress` table:**
- Tracks user progress through individual lessons
- Fields: `id`, `user_id`, `lesson_id`, `module_id`, `status`, `time_spent_minutes`, `quiz_score`, `quiz_attempts`, `started_at`, `completed_at`, `last_accessed`
- Unique constraint on `(user_id, lesson_id)`

#### Updated Tables

**`user_progress` table:**
- Added `current_lesson_id` field to track which lesson the user is currently on
- Progress percentage is automatically calculated based on completed lessons

### 2. Backend API Endpoints

All endpoints are under `/api/course/` prefix:

#### `GET /api/course/modules/<module_id>/lessons`
- Returns all lessons for a training module with user progress
- Response includes:
  - Module information (id, title, description, total_lessons)
  - Array of lessons with progress status for each

#### `GET /api/course/lessons/<lesson_id>`
- Returns detailed content for a specific lesson
- Automatically creates/updates progress record when accessed
- Updates module progress to track current lesson
- Response includes full lesson content (parsed JSON) and progress data

#### `POST /api/course/lessons/<lesson_id>/complete`
- Marks a lesson as complete
- Accepts optional data: `time_spent_minutes`, `quiz_score`
- Automatically updates module progress percentage
- Returns updated progress status

#### `PUT /api/course/lessons/<lesson_id>/progress`
- Updates lesson progress (time spent, status)
- Used for tracking partial progress

### 3. Frontend Components

#### **CourseViewerPage** (`src/pages/CourseViewerPage.jsx`)
Main course viewer with:
- **Sidebar**: Lesson list with progress indicators
- **Content Area**: Displays current lesson
- **Navigation**: Previous/Next buttons, progress bar
- **Auto-resume**: Starts at first incomplete lesson

#### **VideoLesson** (`src/components/course/VideoLesson.jsx`)
- Embedded video player (YouTube/Vimeo support)
- Key takeaways section
- Transcript display
- Additional resources links
- "Mark as Complete" button

#### **TextLesson** (`src/components/course/TextLesson.jsx`)
- Multi-section content display
- Examples with good/bad comparisons
- Rich text formatting
- "Mark as Complete" button

#### **QuizLesson** (`src/components/course/QuizLesson.jsx`)
- Multiple choice questions
- Progress indicator
- Immediate feedback on submission
- Detailed answer explanations
- Retry functionality for failed attempts
- Passing score requirement (configurable per quiz)

#### **InteractiveLesson** (`src/components/course/InteractiveLesson.jsx`)
- Hands-on exercises
- Hint system
- Sample solutions (reveal on demand)
- Progress tracking per exercise
- Completion criteria (e.g., "complete 2 out of 3 exercises")

### 4. Sample Course Content

**Google AI Essentials** module now includes 7 complete lessons:

1. **Introduction to AI and Machine Learning** (Video, 15 min)
   - Embedded video, key points, transcript, resources

2. **Understanding Large Language Models** (Text, 20 min)
   - 4 sections covering LLM basics, how they work, popular models, capabilities/limitations

3. **Knowledge Check: AI Fundamentals** (Quiz, 10 min)
   - 3 questions with explanations
   - 70% passing score

4. **Prompt Engineering Basics** (Text, 25 min)
   - Principles, patterns, techniques
   - Examples of good vs bad prompts

5. **Hands-On: Practice Prompt Engineering** (Interactive, 20 min)
   - 2 exercises with hints and sample solutions
   - Requires completing 2 exercises

6. **AI Ethics and Responsible Use** (Text, 15 min)
   - Ethical principles, concerns, best practices

7. **Final Assessment: Google AI Essentials** (Quiz, 15 min)
   - 5 comprehensive questions
   - 80% passing score

### 5. Integration with Existing Features

#### Dashboard
- "Start Learning" buttons now link to `/training/modules/:moduleId/learn`
- Shows "Continue Learning" if progress > 0%

#### Training Module Page
- "Start Learning" / "Continue Learning" button links to course viewer
- Progress bar shows completion percentage

#### Progress Tracking
- Module progress automatically updates when lessons are completed
- Percentage calculated as: `(completed_lessons / total_lessons) * 100`
- Module status changes to "completed" when all lessons are done

#### Course Recommendations
- Recommended courses link directly to course viewer
- Can be enhanced to hide completed courses (future improvement)

## 🚀 How to Use

### For Users

1. **Start a Course:**
   - Go to Dashboard or Training page
   - Click "Start Learning" on any course with content
   - You'll be taken to the course viewer

2. **Navigate Lessons:**
   - Use the sidebar to see all lessons and jump between them
   - Use Previous/Next buttons to move sequentially
   - Progress is automatically saved

3. **Complete Lessons:**
   - Watch videos, read content, or complete exercises
   - Click "Mark as Complete" when done
   - For quizzes, answer all questions and submit

4. **Track Progress:**
   - See your progress in the sidebar progress bar
   - Completed lessons show a green checkmark
   - Dashboard shows overall module progress

### For Developers

#### Adding New Course Content

1. **Create Lesson Data:**
```python
lesson_data = {
    'title': 'Your Lesson Title',
    'description': 'Brief description',
    'order_index': 1,  # Order within module
    'content_type': 'text',  # or 'video', 'quiz', 'interactive'
    'estimated_duration_minutes': 15,
    'is_required': True,
    'content': json.dumps({
        # Content structure varies by type
        # See examples in backend/seeders/course_content.py
    })
}
```

2. **Add to Database:**
```python
from models import db, Lesson
import uuid

lesson = Lesson(
    id=str(uuid.uuid4()),
    module_id='your-module-id',
    **lesson_data
)
db.session.add(lesson)
db.session.commit()
```

3. **Content Structure by Type:**

**Video Lesson:**
```json
{
  "video_url": "https://www.youtube.com/embed/VIDEO_ID",
  "transcript": "Full transcript text...",
  "key_points": ["Point 1", "Point 2"],
  "resources": [
    {"title": "Resource Name", "url": "https://..."}
  ]
}
```

**Text Lesson:**
```json
{
  "sections": [
    {
      "heading": "Section Title",
      "content": "Section content..."
    }
  ],
  "examples": [
    {
      "bad": "Bad example",
      "good": "Good example",
      "why": "Explanation"
    }
  ]
}
```

**Quiz Lesson:**
```json
{
  "passing_score": 70,
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "type": "multiple_choice",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": 0,
      "explanation": "Why this is correct..."
    }
  ]
}
```

**Interactive Lesson:**
```json
{
  "exercises": [
    {
      "id": "ex1",
      "title": "Exercise Title",
      "description": "What to do",
      "prompt": "Starting prompt (optional)",
      "task": "Task description (optional)",
      "hints": ["Hint 1", "Hint 2"],
      "sample_solution": "Example solution"
    }
  ],
  "completion_criteria": "Complete at least 2 exercises"
}
```

## 📁 Files Created/Modified

### Backend Files Created:
- `backend/models.py` - Added `Lesson` and `LessonProgress` models
- `backend/routes/course_content.py` - Course content API routes
- `backend/migrations/add_course_content_tables.py` - Database migration
- `backend/seeders/course_content.py` - Sample course content seeder

### Backend Files Modified:
- `backend/app.py` - Registered course_content blueprint
- `backend/models.py` - Updated `UserProgress` and `TrainingModule` models

### Frontend Files Created:
- `src/pages/CourseViewerPage.jsx` - Main course viewer
- `src/components/course/VideoLesson.jsx` - Video lesson component
- `src/components/course/TextLesson.jsx` - Text lesson component
- `src/components/course/QuizLesson.jsx` - Quiz lesson component
- `src/components/course/InteractiveLesson.jsx` - Interactive lesson component

### Frontend Files Modified:
- `src/App.jsx` - Added course viewer route
- `src/pages/TrainingModulePage.jsx` - Updated "Start Learning" button
- `src/pages/DashboardPage.jsx` - Updated recommendation links

## 🧪 Testing

### Manual Testing Steps:

1. **Test Course Viewer Access:**
   ```
   - Go to http://localhost:5173/dashboard
   - Click "Start Learning" on "Google AI Essentials"
   - Verify course viewer loads with 7 lessons
   ```

2. **Test Video Lesson:**
   ```
   - Click on "Introduction to AI and Machine Learning"
   - Verify video player loads
   - Verify key points and resources display
   - Click "Mark as Complete"
   - Verify lesson shows green checkmark
   ```

3. **Test Text Lesson:**
   ```
   - Click on "Understanding Large Language Models"
   - Verify all sections display correctly
   - Click "Mark as Complete"
   ```

4. **Test Quiz Lesson:**
   ```
   - Click on "Knowledge Check: AI Fundamentals"
   - Answer all 3 questions
   - Click "Submit Quiz"
   - Verify score calculation and feedback
   - If failed, verify "Try Again" button works
   ```

5. **Test Interactive Lesson:**
   ```
   - Click on "Hands-On: Practice Prompt Engineering"
   - Verify exercises display
   - Click "Show Hints" and "Show Sample Solution"
   - Mark 2 exercises as complete
   - Verify lesson completion button activates
   ```

6. **Test Progress Tracking:**
   ```
   - Complete all 7 lessons
   - Verify progress bar reaches 100%
   - Go back to Dashboard
   - Verify module shows as completed
   ```

### API Testing:

```bash
# Get lessons for a module
curl http://localhost:5001/api/course/modules/module-google-ai-essentials/lessons

# Get specific lesson content
curl http://localhost:5001/api/course/lessons/LESSON_ID

# Complete a lesson
curl -X POST http://localhost:5001/api/course/lessons/LESSON_ID/complete \
  -H "Content-Type: application/json" \
  -d '{"time_spent_minutes": 15}'
```

## 🎯 Future Enhancements

1. **Content Management UI:**
   - Admin interface to add/edit lessons without code
   - WYSIWYG editor for text content
   - Video upload integration

2. **Advanced Features:**
   - Bookmarking/notes within lessons
   - Discussion forums per lesson
   - Peer review for interactive exercises
   - Certificates upon course completion

3. **Analytics:**
   - Time spent per lesson
   - Quiz performance analytics
   - Drop-off points identification
   - Completion rate tracking

4. **Content Types:**
   - Code editor lessons (for programming courses)
   - Audio lessons (podcasts)
   - Live session integration
   - Downloadable resources (PDFs, worksheets)

5. **Gamification:**
   - Points/badges for completing lessons
   - Leaderboards
   - Streaks for daily learning
   - Achievement system

## 📝 Notes

- All course content is stored in JSON format in the database for flexibility
- The system supports unlimited lessons per module
- Progress is tracked at both lesson and module levels
- Quiz scores are saved for analytics and certification purposes
- The course viewer is fully responsive and works on mobile devices

## 🐛 Troubleshooting

**Issue: Course viewer shows "Loading..." indefinitely**
- Check browser console for errors
- Verify backend is running on port 5001
- Check that module has lessons in database

**Issue: Lessons don't show progress**
- Verify user is authenticated
- Check that lesson_progress table exists
- Verify API endpoints are returning progress data

**Issue: Quiz doesn't submit**
- Ensure all questions are answered
- Check browser console for JavaScript errors
- Verify quiz content JSON is valid

## 🎉 Success!

The course content management system is now fully functional! Users can:
- ✅ Access complete courses within the platform
- ✅ Watch videos, read content, take quizzes, and complete exercises
- ✅ Track their progress through courses
- ✅ See their completion status on the dashboard
- ✅ Get personalized course recommendations based on assessments

The system is ready for production use and can be easily extended with additional content and features!

