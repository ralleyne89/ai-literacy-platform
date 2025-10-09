# Testing Guide: New Course Content

## Overview

This guide provides step-by-step instructions for testing the newly added course content on the LitmusAI platform.

---

## 🆕 What's New

### New Courses Added
1. **Prompt Engineering Mastery** (6 lessons)
2. **Elements of AI** (5 lessons)

### Updated Courses
1. **Introduction to AI Fundamentals** (7 lessons - already existed)

**Total:** 18 lessons across 3 courses

---

## ✅ Pre-Testing Checklist

Before testing, ensure:

- [ ] Backend server is running (`cd backend && python app.py`)
- [ ] Frontend dev server is running (`npm run dev`)
- [ ] Database has been seeded (`cd backend && python seeders/course_content.py --force`)
- [ ] You're logged in to the platform

---

## 🧪 Test Plan

### Test 1: Verify Database Content

**Purpose:** Confirm all lessons were created in the database

**Steps:**
```bash
cd backend && python3 -c "
from app import app, db
from models import Lesson, TrainingModule

with app.app_context():
    courses = [
        ('module-ai-fundamentals-intro', 'Introduction to AI Fundamentals', 7),
        ('module-prompt-master', 'Prompt Engineering Mastery', 6),
        ('module-elements-of-ai', 'Elements of AI', 5)
    ]
    
    print('📚 Database Verification:\n')
    
    for module_id, title, expected_count in courses:
        actual_count = Lesson.query.filter_by(module_id=module_id).count()
        status = '✅' if actual_count == expected_count else '❌'
        print(f'{status} {title}')
        print(f'   Expected: {expected_count} lessons')
        print(f'   Actual: {actual_count} lessons')
        print()
"
```

**Expected Output:**
```
✅ Introduction to AI Fundamentals
   Expected: 7 lessons
   Actual: 7 lessons

✅ Prompt Engineering Mastery
   Expected: 6 lessons
   Actual: 6 lessons

✅ Elements of AI
   Expected: 5 lessons
   Actual: 5 lessons
```

**Result:** [ ] Pass [ ] Fail

---

### Test 2: Access Prompt Engineering Mastery

**Purpose:** Verify the new Prompt Engineering course loads correctly

**Steps:**
1. Open browser to: `http://localhost:5173/training/modules/module-prompt-master/learn`
2. Wait for course viewer to load

**Expected Results:**
- [ ] Course viewer loads without errors
- [ ] Sidebar shows 6 lessons:
  - [ ] Welcome to Prompt Engineering Mastery
  - [ ] Prompt Design Fundamentals
  - [ ] Knowledge Check: Prompt Fundamentals
  - [ ] Advanced Prompt Patterns
  - [ ] Hands-On: Prompt Engineering Lab
  - [ ] Final Assessment
- [ ] First lesson content displays
- [ ] Content includes CRAFT framework explanation
- [ ] Navigation buttons (Next) are visible

**Screenshots:** (Take screenshots of any issues)

**Result:** [ ] Pass [ ] Fail

---

### Test 3: Navigate Through Prompt Engineering Course

**Purpose:** Test lesson navigation and content display

**Steps:**
1. Start at lesson 1
2. Click "Next" to go to lesson 2
3. Verify lesson 2 content displays (Prompt Design Fundamentals)
4. Click on lesson 3 in sidebar (Knowledge Check)
5. Verify quiz displays with questions
6. Click on lesson 5 (Hands-On Lab)
7. Verify interactive exercises display

**Expected Results:**
- [ ] Lesson 2 shows CRAFT framework content
- [ ] Lesson 3 shows quiz with 3 questions
- [ ] Lesson 5 shows interactive exercises with hints
- [ ] All navigation works smoothly
- [ ] No console errors

**Result:** [ ] Pass [ ] Fail

---

### Test 4: Take Quiz in Prompt Engineering Course

**Purpose:** Test quiz functionality

**Steps:**
1. Navigate to "Knowledge Check: Prompt Fundamentals" (lesson 3)
2. Read question 1
3. Select an answer
4. Click "Submit Answer"
5. Verify feedback appears
6. Complete all 3 questions
7. Check final score

**Expected Results:**
- [ ] Quiz shows 3 questions
- [ ] Can select answers
- [ ] Submit button works
- [ ] Correct/incorrect feedback displays
- [ ] Explanations show after submission
- [ ] Final score calculates correctly
- [ ] Passing score is 70%

**Result:** [ ] Pass [ ] Fail

---

### Test 5: Access Elements of AI Course

**Purpose:** Verify the new Elements of AI course loads correctly

**Steps:**
1. Open browser to: `http://localhost:5173/training/modules/module-elements-of-ai/learn`
2. Wait for course viewer to load

**Expected Results:**
- [ ] Course viewer loads without errors
- [ ] Sidebar shows 5 lessons:
  - [ ] Welcome to Elements of AI
  - [ ] What is AI?
  - [ ] Knowledge Check: AI Fundamentals
  - [ ] Real-World AI Applications
  - [ ] Continue Your AI Learning Journey
- [ ] First lesson displays attribution to University of Helsinki
- [ ] Disclaimer about unofficial content is visible
- [ ] Links to official course are present

**Result:** [ ] Pass [ ] Fail

---

### Test 6: Verify IP Compliance in Elements of AI

**Purpose:** Ensure proper attribution and disclaimers

**Steps:**
1. Open Elements of AI course
2. Read lesson 1 (Welcome)
3. Check for attribution
4. Check for disclaimers
5. Check for links to official course

**Expected Results:**
- [ ] Clear statement: "This is NOT the official Elements of AI course"
- [ ] Attribution to University of Helsinki and MinnaLearn
- [ ] Link to https://www.elementsofai.com/
- [ ] Encouragement to take official course for certification
- [ ] Professional, respectful tone

**Result:** [ ] Pass [ ] Fail

---

### Test 7: Navigate Through Elements of AI

**Purpose:** Test all lesson types in Elements of AI

**Steps:**
1. Read lesson 1 (Welcome)
2. Navigate to lesson 2 (What is AI?)
3. Verify content about AI definitions
4. Navigate to lesson 3 (Quiz)
5. Take the quiz
6. Navigate to lesson 4 (Real-World Applications)
7. Navigate to lesson 5 (Continue Learning)

**Expected Results:**
- [ ] Lesson 2 explains AI, ML, DL differences
- [ ] Lesson 3 quiz has 3 questions
- [ ] Lesson 4 covers healthcare, finance, education, etc.
- [ ] Lesson 5 has links to additional resources
- [ ] All content displays correctly
- [ ] No broken links

**Result:** [ ] Pass [ ] Fail

---

### Test 8: Progress Tracking

**Purpose:** Verify progress is tracked across courses

**Steps:**
1. Open Prompt Engineering course
2. Complete lesson 1
3. Navigate to lesson 2
4. Refresh the page
5. Check if progress is maintained

**Expected Results:**
- [ ] Lesson 1 marked as complete
- [ ] Current lesson indicator shows lesson 2
- [ ] Progress persists after refresh
- [ ] Can resume where you left off

**Result:** [ ] Pass [ ] Fail

---

### Test 9: Access from Dashboard

**Purpose:** Verify courses appear in recommendations

**Steps:**
1. Go to Dashboard (`http://localhost:5173/dashboard`)
2. Look for "Recommended Training" section
3. Check if new courses appear
4. Click "Start Learning" on a course
5. Verify it opens course viewer

**Expected Results:**
- [ ] Dashboard loads successfully
- [ ] Recommended courses section visible
- [ ] At least one of the new courses appears
- [ ] "Start Learning" button works
- [ ] Opens correct course viewer

**Result:** [ ] Pass [ ] Fail

---

### Test 10: Access from Training Modules Page

**Purpose:** Verify courses appear in catalog

**Steps:**
1. Go to Training Modules page
2. Find "Prompt Engineering Mastery"
3. Find "Elements of AI"
4. Click on each course card
5. Verify course details display
6. Click "Start Learning"

**Expected Results:**
- [ ] Both courses visible in catalog
- [ ] Course cards show correct information
- [ ] Clicking card shows course details
- [ ] "Start Learning" button present
- [ ] Button opens course viewer

**Result:** [ ] Pass [ ] Fail

---

### Test 11: Mobile Responsiveness

**Purpose:** Verify courses work on mobile devices

**Steps:**
1. Open browser dev tools
2. Switch to mobile view (iPhone/Android)
3. Navigate to a course
4. Test navigation
5. Test quiz interaction

**Expected Results:**
- [ ] Course viewer is responsive
- [ ] Sidebar adapts to mobile (hamburger menu or similar)
- [ ] Lessons are readable on small screens
- [ ] Buttons are tappable
- [ ] Quizzes work on mobile

**Result:** [ ] Pass [ ] Fail

---

### Test 12: Error Handling

**Purpose:** Test edge cases and error handling

**Steps:**
1. Try to access non-existent course: `/training/modules/fake-course/learn`
2. Try to access course while logged out
3. Try to navigate to lesson that doesn't exist

**Expected Results:**
- [ ] Non-existent course shows error message
- [ ] Logged-out users are redirected to login
- [ ] Invalid lesson navigation handled gracefully
- [ ] No console errors that break the app

**Result:** [ ] Pass [ ] Fail

---

## 🐛 Bug Report Template

If you find issues, use this template:

```
**Bug Title:** [Brief description]

**Course:** [Which course]

**Lesson:** [Which lesson]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach screenshots]

**Console Errors:**
[Copy any console errors]

**Browser:** [Chrome/Firefox/Safari]

**Priority:** [High/Medium/Low]
```

---

## ✅ Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Database Verification | [ ] Pass [ ] Fail | |
| 2. Access Prompt Engineering | [ ] Pass [ ] Fail | |
| 3. Navigate Prompt Engineering | [ ] Pass [ ] Fail | |
| 4. Quiz Functionality | [ ] Pass [ ] Fail | |
| 5. Access Elements of AI | [ ] Pass [ ] Fail | |
| 6. IP Compliance | [ ] Pass [ ] Fail | |
| 7. Navigate Elements of AI | [ ] Pass [ ] Fail | |
| 8. Progress Tracking | [ ] Pass [ ] Fail | |
| 9. Dashboard Access | [ ] Pass [ ] Fail | |
| 10. Training Page Access | [ ] Pass [ ] Fail | |
| 11. Mobile Responsiveness | [ ] Pass [ ] Fail | |
| 12. Error Handling | [ ] Pass [ ] Fail | |

**Overall Status:** [ ] All Pass [ ] Some Failures

---

## 📊 Performance Checklist

- [ ] Course viewer loads in < 2 seconds
- [ ] Lesson navigation is instant
- [ ] No memory leaks (check dev tools)
- [ ] No unnecessary re-renders
- [ ] Images/content load quickly

---

## 🎯 Acceptance Criteria

The course expansion is considered successful if:

- ✅ All 3 courses have correct number of lessons in database
- ✅ All courses load without errors
- ✅ All lesson types display correctly (text, quiz, interactive)
- ✅ Navigation works smoothly
- ✅ Quizzes are functional
- ✅ Progress tracking works
- ✅ IP compliance is maintained (proper attribution)
- ✅ Courses accessible from dashboard and training page
- ✅ Mobile responsive
- ✅ No critical bugs

---

## 📝 Notes

**Tester Name:** _______________  
**Date:** _______________  
**Environment:** [ ] Local [ ] Staging [ ] Production  
**Browser:** _______________  
**Additional Comments:**

---

**Status:** Ready for Testing  
**Priority:** High  
**Estimated Testing Time:** 30-45 minutes

