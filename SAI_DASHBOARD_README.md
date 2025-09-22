# SAI Officials Dashboard

## Overview
The SAI Officials Dashboard is a comprehensive admin panel that allows Sports Authority of India (SAI) officials to manage and assess athlete test attempts. This dashboard provides complete visibility into athlete data, test videos, and assessment capabilities.

## Features

### 🏃‍♂️ Athlete Management
- **Complete Athlete Profiles**: View detailed athlete information including personal details, physical measurements, and contact information
- **Athlete Search & Filter**: Search athletes by name, sport, or city for quick access
- **BMI Calculation**: Automatic BMI calculation with health status indicators
- **Registration Tracking**: View athlete registration dates and status

### 📹 Video Assessment
- **Video Player**: Full-screen video player for reviewing athlete test attempts
- **Video Controls**: Native video controls for play, pause, seek, and volume
- **Test Type Identification**: Clear labeling of test types and attempt dates

### 📊 Assessment System
- **Score Assignment**: Assign scores from 0-100 for each test attempt
- **Detailed Remarks**: Add comprehensive feedback and remarks for athletes
- **Assessment Tracking**: Track which official assessed each attempt and when
- **Status Management**: Update attempt status (in-progress, done, failed)

### 📈 Dashboard Analytics
- **Overview Statistics**: Total athletes, test attempts, and completed assessments
- **Real-time Updates**: Live data updates as assessments are submitted
- **Progress Tracking**: Visual indicators for assessment completion status

### 🔍 Advanced Features
- **Athlete Profile Modal**: Detailed view of individual athlete profiles with complete history
- **Responsive Design**: Optimized for mobile and tablet devices
- **Offline Capability**: Works with cached data when network is limited
- **Data Validation**: Input validation for scores and remarks

## Technical Implementation

### Data Structure
The dashboard integrates with the following data models:

#### Athlete Profile
```typescript
interface AthleteProfile {
  _id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  sport: string;
  height: number;
  weight: number;
  city: string;
  contact: string;
  clerkId: string;
  createdAt: string;
}
```

#### Test Attempt
```typescript
interface TestAttempt {
  _id: string;
  testType: string;
  userId: string;
  videoUrl: string;
  status: "in-progress" | "done" | "failed";
  score?: number;
  remarks?: string;
  assessedBy?: string;
  assessedAt?: string;
  createdAt: string;
}
```

### Key Components

#### 1. Main Dashboard (`src/app/(app)/(sai)/dashboard.tsx`)
- Central hub for all athlete and assessment management
- Real-time data fetching and display
- Search and filtering capabilities
- Modal management for video and assessment forms

#### 2. Athlete Profile Modal (`src/app/components/AthleteProfileModal.tsx`)
- Comprehensive athlete profile display
- BMI calculation and health status
- Complete test attempt history
- Professional styling with responsive design

#### 3. Assessment Service (`src/services/assessment.ts`)
- Assessment submission and validation
- Data fetching utilities
- Statistics calculation
- Error handling and user feedback

### Database Schema Updates
The Sanity CMS schema has been enhanced with new fields:

```typescript
// New fields added to testAttempt schema
score: number;           // Score given by SAI official (0-100)
remarks: string;         // Assessment remarks
assessedBy: string;      // SAI Official ID who assessed
assessedAt: datetime;    // Date and time of assessment
```

## Usage Instructions

### For SAI Officials

1. **Access Dashboard**
   - Navigate to SAI Officials Dashboard from the home screen
   - Dashboard loads all athlete data and test attempts

2. **Search Athletes**
   - Use the search bar to find specific athletes
   - Search by name, sport, or city
   - Results update in real-time

3. **View Athlete Details**
   - Click on any athlete card to view complete profile
   - Review physical measurements and contact information
   - Check BMI status and health indicators

4. **Assess Test Attempts**
   - Click the "Play" button to view test videos
   - Use full-screen video player with native controls
   - Click "Assess" button to open assessment form
   - Enter score (0-100) and detailed remarks
   - Submit assessment to update status

5. **Monitor Progress**
   - View overview statistics at the top of dashboard
   - Track total athletes, attempts, and completed assessments
   - Use status indicators to identify pending assessments

### Assessment Guidelines

#### Scoring System
- **90-100**: Excellent performance, ready for competition
- **80-89**: Good performance, minor improvements needed
- **70-79**: Average performance, significant improvement required
- **60-69**: Below average, extensive training needed
- **Below 60**: Poor performance, fundamental issues to address

#### Remarks Best Practices
- Provide specific, actionable feedback
- Highlight both strengths and areas for improvement
- Include technical corrections where applicable
- Suggest training recommendations
- Maintain professional and encouraging tone

## Security & Data Protection

- All assessments are tied to the assessing official's ID
- Timestamps track when assessments were completed
- Data validation prevents invalid submissions
- Secure video storage through Supabase
- Role-based access control for SAI officials

## Performance Optimization

- Efficient data fetching with minimal API calls
- Image and video lazy loading
- Cached data for offline functionality
- Optimized database queries
- Responsive design for various screen sizes

## Future Enhancements

- Bulk assessment capabilities
- Export functionality for reports
- Advanced filtering and sorting options
- Notification system for new submissions
- Integration with external assessment tools
- Performance analytics and trends
- Automated scoring suggestions using AI

## Support

For technical issues or feature requests, please contact the development team or create an issue in the project repository.

---

*Last updated: December 2024*
