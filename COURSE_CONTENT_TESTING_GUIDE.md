# Course Content System - Testing Guide

## 🎯 Quick Test Checklist

Follow these steps to test the new course content management system:

### 1. Access the Dashboard
- ✅ Open http://localhost:5173/dashboard in your browser
- ✅ Make sure you're logged in
- ✅ You should see "Google AI Essentials" in the recommended courses section

### 2. Start the Course
- ✅ Click "Start Learning" on the "Google AI Essentials" card
- ✅ You should be redirected to `/training/modules/module-google-ai-essentials/learn`
- ✅ The course viewer should load with:
  - Sidebar showing 7 lessons
  - Progress bar at 0%
  - First lesson content displayed

### 3. Test Video Lesson (Lesson 1)
- ✅ Verify "Introduction to AI and Machine Learning" is displayed
- ✅ Check that the video player is visible (YouTube embed)
- ✅ Scroll down to see:
  - Key Takeaways section with 4 bullet points
  - Transcript section
  - Additional Resources section with 2 links
- ✅ Click "Mark as Complete" button
- ✅ Verify:
  - Button changes to green "Completed" state
  - Lesson 1 in sidebar shows green checkmark
  - Progress bar updates to ~14% (1/7 lessons)
  - You're automatically moved to Lesson 2

### 4. Test Text Lesson (Lesson 2)
- ✅ Verify "Understanding Large Language Models" is displayed
- ✅ Check that all 4 sections are visible:
  - What are Large Language Models?
  - How LLMs Work
  - Popular LLMs
  - Capabilities and Limitations
- ✅ Verify content is well-formatted and readable
- ✅ Click "Mark as Complete"
- ✅ Verify progress updates to ~29% (2/7 lessons)

### 5. Test Quiz Lesson (Lesson 3)
- ✅ Verify "Knowledge Check: AI Fundamentals" is displayed
- ✅ Check quiz header shows:
  - "Question 1 of 3"
  - "Passing Score: 70%"
- ✅ Answer the first question by clicking an option
- ✅ Verify the selected option is highlighted
- ✅ Click "Next" to go to question 2
- ✅ Answer question 2
- ✅ Click "Next" to go to question 3
- ✅ Answer question 3
- ✅ Click "Submit Quiz"
- ✅ Verify results page shows:
  - Your score percentage
  - Pass/fail status
  - Detailed review of each question with:
    - Your answer (highlighted in red if wrong)
    - Correct answer (highlighted in green)
    - Explanation for each question
- ✅ If you passed (≥70%), verify:
  - Green success message
  - Lesson marked as complete
  - Progress updates to ~43% (3/7 lessons)
- ✅ If you failed (<70%), verify:
  - Red failure message
  - "Try Again" button appears
  - Can retry the quiz

### 6. Test Text Lesson with Examples (Lesson 4)
- ✅ Verify "Prompt Engineering Basics" is displayed
- ✅ Check all sections display:
  - What is Prompt Engineering?
  - Key Principles
  - Prompt Patterns
  - Common Techniques
- ✅ Scroll to bottom to see examples section (if present)
- ✅ Click "Mark as Complete"
- ✅ Verify progress updates to ~57% (4/7 lessons)

### 7. Test Interactive Lesson (Lesson 5)
- ✅ Verify "Hands-On: Practice Prompt Engineering" is displayed
- ✅ Check that 2 exercises are shown
- ✅ For Exercise 1:
  - Click "Show Hints" button
  - Verify hints appear in yellow box
  - Click "Hide Hints" to collapse
  - Type something in the textarea
  - Click "Show Sample Solution"
  - Verify sample solution appears in green box
  - Click "Mark as Complete" on the exercise
  - Verify exercise shows green checkmark
- ✅ For Exercise 2:
  - Repeat the same steps
  - Mark as complete
- ✅ Verify the main "Complete Lesson" button becomes enabled after 2 exercises
- ✅ Click "Complete Lesson"
- ✅ Verify progress updates to ~71% (5/7 lessons)

### 8. Test Another Text Lesson (Lesson 6)
- ✅ Verify "AI Ethics and Responsible Use" is displayed
- ✅ Read through the content
- ✅ Click "Mark as Complete"
- ✅ Verify progress updates to ~86% (6/7 lessons)

### 9. Test Final Quiz (Lesson 7)
- ✅ Verify "Final Assessment: Google AI Essentials" is displayed
- ✅ Check quiz shows "Question 1 of 5" and "Passing Score: 80%"
- ✅ Answer all 5 questions
- ✅ Submit the quiz
- ✅ Verify results and explanations
- ✅ If passed (≥80%), verify:
  - Lesson marked as complete
  - Progress updates to 100% (7/7 lessons)
  - Module status changes to "completed"

### 10. Test Navigation
- ✅ Click on different lessons in the sidebar
- ✅ Verify you can jump between lessons
- ✅ Use "Previous" and "Next" buttons
- ✅ Verify navigation works correctly
- ✅ Toggle sidebar open/closed with the book icon

### 11. Test Progress Persistence
- ✅ Click "Back to Courses" button
- ✅ Go back to the Dashboard
- ✅ Verify "Google AI Essentials" shows:
  - Progress percentage (should match what you completed)
  - "Continue Learning" button (if not 100%)
  - "Completed" status (if 100%)
- ✅ Click "Continue Learning"
- ✅ Verify you're taken back to the course viewer
- ✅ Verify your progress is still there (completed lessons have checkmarks)

### 12. Test Module Completion
- ✅ If you completed all 7 lessons, go to Dashboard
- ✅ Verify "Google AI Essentials" shows in "Training Progress" section
- ✅ Verify it shows 100% completion
- ✅ Verify completion date is displayed

## 🐛 Common Issues and Solutions

### Issue: Course viewer doesn't load
**Solution:**
- Check that backend is running on port 5001
- Check browser console for errors
- Verify you're logged in
- Try refreshing the page

### Issue: Lessons don't show in sidebar
**Solution:**
- Verify the seeder ran successfully
- Check database has lessons: `sqlite3 backend/instance/ai_literacy.db "SELECT COUNT(*) FROM lesson;"`
- Should return 7

### Issue: Progress doesn't save
**Solution:**
- Check browser console for API errors
- Verify backend logs for errors
- Check that lesson_progress table exists
- Try logging out and back in

### Issue: Quiz doesn't submit
**Solution:**
- Make sure all questions are answered
- Check browser console for JavaScript errors
- Verify quiz content JSON is valid

### Issue: Video doesn't play
**Solution:**
- Check internet connection (YouTube embed requires internet)
- Try a different browser
- Check browser console for embed errors

## ✅ Expected Results

After completing all tests, you should have:

1. **Database:**
   - 7 lessons in the `lesson` table
   - 7 lesson_progress records (if you completed all)
   - 1 user_progress record showing 100% completion

2. **Dashboard:**
   - "Google AI Essentials" showing as completed
   - Completion date displayed
   - Module appears in "Training Progress" section

3. **Course Viewer:**
   - All 7 lessons accessible
   - All lessons showing green checkmarks
   - Progress bar at 100%
   - Can still navigate and review lessons

## 📊 Backend Verification

To verify the data in the database:

```bash
# Check lessons
cd backend
sqlite3 instance/ai_literacy.db "SELECT id, title, content_type, order_index FROM lesson ORDER BY order_index;"

# Check lesson progress (replace USER_ID with your user ID)
sqlite3 instance/ai_literacy.db "SELECT lesson_id, status, quiz_score FROM lesson_progress WHERE user_id='USER_ID';"

# Check module progress
sqlite3 instance/ai_literacy.db "SELECT module_id, progress_percentage, status FROM user_progress WHERE user_id='USER_ID';"
```

## 🎉 Success Criteria

The course content system is working correctly if:

- ✅ All 7 lessons load without errors
- ✅ Each lesson type (video, text, quiz, interactive) displays correctly
- ✅ Progress is tracked and persists across sessions
- ✅ Quizzes calculate scores correctly and show feedback
- ✅ Interactive exercises show hints and solutions
- ✅ Navigation between lessons works smoothly
- ✅ Module completion is reflected on the dashboard
- ✅ "Continue Learning" resumes at the right lesson

## 📝 Notes

- The course viewer is fully responsive - try it on different screen sizes
- All progress is saved automatically - no manual save needed
- You can retake quizzes as many times as needed
- Completed lessons can be reviewed anytime
- The system supports unlimited courses and lessons

---

**Happy Testing! 🚀**

If you encounter any issues not covered in this guide, check the browser console and backend logs for detailed error messages.

