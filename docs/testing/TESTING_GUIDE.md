# Testing Guide: Course Recommendations & Assessment Results

## 🧪 Quick Test Checklist

Use this guide to verify both features are working correctly.

---

## Test 1: View Dashboard Recommendations

### Steps:
1. ✅ Open http://localhost:5173/dashboard in your browser
2. ✅ Login with your account
3. ✅ Look for "Recommended for You" section

### Expected Results:

**If you have taken an assessment:**
- You should see up to 6 course cards
- Each card shows:
  - Priority badge (HIGH PRIORITY or RECOMMENDED)
  - Course title
  - Course description
  - Reason for recommendation (e.g., "Strengthen your AI Fundamentals skills (scored 2/10)")
  - Duration and difficulty level
  - "Start Learning" button

**If you haven't taken an assessment:**
- You should see general beginner course recommendations
- Cards will show "Great for getting started" or similar messages

---

## Test 2: Take Assessment and See Updated Recommendations

### Steps:
1. ✅ Navigate to Assessments page
2. ✅ Take a new assessment
3. ✅ Try to score low in specific domains (e.g., answer AI Fundamentals questions incorrectly)
4. ✅ Complete the assessment
5. ✅ Return to Dashboard

### Expected Results:
- Dashboard should show new recommendations
- Recommendations should target the domains where you scored low
- Priority badges should reflect your skill gaps:
  - **HIGH PRIORITY**: Domains where you scored < 33%
  - **RECOMMENDED**: Domains where you scored 33-50%

### Example:
If you scored:
- AI Fundamentals: 2/10 (20%) → HIGH PRIORITY recommendations
- Ethics: 4/8 (50%) → RECOMMENDED
- Practical Usage: 7/10 (70%) → No recommendations

You should see:
- "Google AI Essentials" with HIGH PRIORITY badge
- "Elements of AI" with HIGH PRIORITY badge
- "Ethical AI in HR Practices" with RECOMMENDED badge

---

## Test 3: Verify Assessment Results Are Saved

### Steps:
1. ✅ Take an assessment (if you haven't already)
2. ✅ Navigate to Dashboard
3. ✅ Scroll to "Recent Assessments" section

### Expected Results:
- You should see a list of all your past assessments
- Each assessment shows:
  - Score (e.g., "45.5%")
  - Date taken
  - Score band (Beginner/Intermediate/Advanced)
  - Domain breakdown

### Verify in Database (Optional):
```bash
cd backend
sqlite3 instance/ai_literacy.db
SELECT * FROM assessment_result ORDER BY completed_at DESC LIMIT 1;
```

You should see:
- Your user_id
- total_score, max_score, percentage
- domain_scores (JSON)
- completed_at timestamp
- recommendations (JSON)

---

## Test 4: Check Recommendation API Directly

### Steps:
1. ✅ Login to the platform
2. ✅ Open browser DevTools (F12)
3. ✅ Go to Network tab
4. ✅ Navigate to Dashboard
5. ✅ Look for request to `/api/assessment/recommendations`

### Expected Results:
- Request should return 200 OK
- Response should contain:
  ```json
  {
    "recommendations": [
      {
        "id": "module-id",
        "title": "Course Title",
        "reason": "Strengthen your X skills (scored Y/Z)",
        "priority": "high",
        "skill_gap_percentage": 80.0
      }
    ],
    "assessment_score": 45.5,
    "weak_domains": ["AI Fundamentals"]
  }
  ```

---

## Test 5: Verify Domain Mappings

### Steps:
1. ✅ Check that training modules have domain mappings:
```bash
cd backend
sqlite3 instance/ai_literacy.db
SELECT id, title, target_domains FROM training_module LIMIT 5;
```

### Expected Results:
Each module should have a `target_domains` value like:
```
["AI Fundamentals", "Practical Usage"]
```

---

## Test 6: Test Recommendation Priority Logic

### Test Case 1: Very Low Score (< 33%)
**Setup**: Score 2/10 (20%) in AI Fundamentals
**Expected**: HIGH PRIORITY badge on AI Fundamentals courses

### Test Case 2: Low Score (33-50%)
**Setup**: Score 4/10 (40%) in Ethics
**Expected**: RECOMMENDED badge on Ethics courses

### Test Case 3: Good Score (> 50%)
**Setup**: Score 8/10 (80%) in Practical Usage
**Expected**: No recommendations for Practical Usage

---

## Test 7: Test "Start Learning" Button

### Steps:
1. ✅ Click "Start Learning" on a recommended course
2. ✅ Verify you're redirected to the training module page
3. ✅ Verify the course content loads correctly

---

## Test 8: Test Multiple Assessments

### Steps:
1. ✅ Take first assessment (score low in AI Fundamentals)
2. ✅ Check recommendations (should show AI Fundamentals courses)
3. ✅ Take second assessment (score low in Ethics)
4. ✅ Check recommendations (should show Ethics courses)

### Expected Results:
- Recommendations should update based on **latest** assessment
- Assessment history should show both assessments
- Older assessments should still be visible in history

---

## 🐛 Troubleshooting

### Issue: No recommendations showing

**Possible Causes:**
1. Not logged in → Login first
2. No assessment taken → Take an assessment
3. Backend not running → Check http://localhost:5001
4. Frontend not running → Check http://localhost:5173

**Solution:**
```bash
# Check backend
curl http://localhost:5001/api/billing/config

# Check frontend
curl http://localhost:5173

# Restart backend
cd backend && source venv/bin/activate && python app.py

# Restart frontend
npm run dev
```

### Issue: Recommendations not personalized

**Possible Causes:**
1. No assessment results in database
2. Domain mappings not seeded
3. Assessment results not saved

**Solution:**
```bash
# Re-run setup
./setup_recommendations.sh

# Check assessment results
cd backend
sqlite3 instance/ai_literacy.db
SELECT COUNT(*) FROM assessment_result;

# Check domain mappings
SELECT COUNT(*) FROM training_module WHERE target_domains IS NOT NULL;
```

### Issue: "Unauthorized" error

**Possible Causes:**
1. Not logged in
2. Session expired
3. JWT token invalid

**Solution:**
1. Logout and login again
2. Clear browser cookies
3. Check Supabase auth is working

### Issue: Database errors

**Possible Causes:**
1. Migration not run
2. Database schema out of sync

**Solution:**
```bash
cd backend
python3 run_migration.py
python3 seed_modules.py
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Dashboard loads without errors
2. ✅ "Recommended for You" section appears
3. ✅ Course cards show personalized recommendations
4. ✅ Priority badges reflect your skill gaps
5. ✅ Clicking "Start Learning" navigates to course
6. ✅ Assessment history shows all past assessments
7. ✅ Recommendations update after taking new assessment

---

## 📊 Sample Test Data

### Sample Assessment Result:
```json
{
  "user_id": "user-123",
  "total_score": 18,
  "max_score": 40,
  "percentage": 45.0,
  "domain_scores": {
    "AI Fundamentals": {"score": 2, "total": 10},
    "Practical Usage": {"score": 7, "total": 10},
    "Ethics & Critical Thinking": {"score": 4, "total": 8},
    "AI Impact & Applications": {"score": 3, "total": 7},
    "Strategic Understanding": {"score": 2, "total": 5}
  },
  "completed_at": "2025-10-09T03:00:00Z"
}
```

### Expected Recommendations:
1. **HIGH PRIORITY**: AI Fundamentals courses (scored 20%)
2. **HIGH PRIORITY**: Strategic Understanding courses (scored 40%)
3. **RECOMMENDED**: AI Impact courses (scored 43%)
4. **RECOMMENDED**: Ethics courses (scored 50%)

---

## 🎯 Test Scenarios

### Scenario 1: New User Journey
1. Create account
2. Take assessment
3. Score low in AI Fundamentals
4. Visit dashboard
5. See HIGH PRIORITY recommendations for AI Fundamentals
6. Click "Start Learning"
7. Complete a course
8. Retake assessment
9. See improved score
10. See updated recommendations

### Scenario 2: Experienced User
1. Login with existing account
2. Already has assessment history
3. Visit dashboard
4. See recommendations based on latest assessment
5. Take new assessment
6. Score better in weak areas
7. See recommendations shift to other domains

### Scenario 3: Advanced User
1. Login
2. Take assessment
3. Score high in all domains (> 80%)
4. Visit dashboard
5. See general "continued learning" recommendations
6. No HIGH PRIORITY badges

---

## 📝 Test Report Template

Use this template to document your testing:

```
## Test Report: Course Recommendations

**Date**: [Date]
**Tester**: [Your Name]
**Environment**: Local Development

### Test Results:

- [ ] Test 1: View Dashboard Recommendations - PASS/FAIL
- [ ] Test 2: Take Assessment - PASS/FAIL
- [ ] Test 3: Verify Results Saved - PASS/FAIL
- [ ] Test 4: Check API Response - PASS/FAIL
- [ ] Test 5: Verify Domain Mappings - PASS/FAIL
- [ ] Test 6: Test Priority Logic - PASS/FAIL
- [ ] Test 7: Test Start Learning - PASS/FAIL
- [ ] Test 8: Test Multiple Assessments - PASS/FAIL

### Issues Found:
[List any issues]

### Notes:
[Any additional observations]
```

---

## 🚀 Ready to Test!

Everything is set up and ready. Start with Test 1 and work your way through the checklist.

**Quick Start:**
1. Open http://localhost:5173/dashboard
2. Login
3. Look for "Recommended for You" section
4. Take an assessment if you haven't already
5. Enjoy your personalized recommendations!

Good luck! 🎉

