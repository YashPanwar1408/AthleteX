import { client } from '../lib/sanity/client';
import { TestAttempt } from '../lib/sanity/types';

export interface AssessmentInput {
  attemptId: string;
  score: number;
  remarks: string;
  assessedBy: string;
}

export interface AssessmentResult {
  success: boolean;
  attempt?: TestAttempt;
  error?: string;
}

export const submitAssessment = async ({
  attemptId,
  score,
  remarks,
  assessedBy,
}: AssessmentInput): Promise<AssessmentResult> => {
  try {
    // Validate score
    if (score < 0 || score > 100) {
      return {
        success: false,
        error: 'Score must be between 0 and 100',
      };
    }

    // Validate remarks
    if (!remarks.trim()) {
      return {
        success: false,
        error: 'Remarks are required',
      };
    }

    // Update the test attempt with assessment data
    const updatedAttempt = await client
      .patch(attemptId)
      .set({
        score,
        remarks: remarks.trim(),
        assessedBy,
        assessedAt: new Date().toISOString(),
        status: 'done',
      })
      .commit();

    return {
      success: true,
      attempt: updatedAttempt,
    };
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return {
      success: false,
      error: 'Failed to submit assessment. Please try again.',
    };
  }
};

export const getAthleteAttempts = async (athleteId: string): Promise<TestAttempt[]> => {
  try {
    const attempts = await client.fetch(`
      *[_type == "testAttempt" && userId == $athleteId] {
        _id,
        testType,
        userId,
        videoUrl,
        status,
        result,
        score,
        remarks,
        assessedBy,
        assessedAt,
        createdAt
      } | order(createdAt desc)
    `, { athleteId });

    return attempts;
  } catch (error) {
    console.error('Error fetching athlete attempts:', error);
    throw new Error('Failed to fetch athlete attempts');
  }
};

export const getAllAttemptsWithAthletes = async () => {
  try {
    // Fetch all athletes
    const athletes = await client.fetch(`
      *[_type == "athlete"] {
        _id,
        name,
        age,
        gender,
        sport,
        height,
        weight,
        city,
        contact,
        clerkId,
        createdAt
      }
    `);

    // Fetch all test attempts
    const attempts = await client.fetch(`
      *[_type == "testAttempt"] {
        _id,
        testType,
        userId,
        videoUrl,
        status,
        result,
        score,
        remarks,
        assessedBy,
        assessedAt,
        createdAt
      } | order(createdAt desc)
    `);

    // Group attempts by athlete
    const athletesWithAttempts = athletes.map((athlete: any) => ({
      ...athlete,
      attempts: attempts.filter((attempt: TestAttempt) => 
        attempt.userId === athlete.clerkId || attempt.userId === athlete._id
      ),
    }));

    return athletesWithAttempts;
  } catch (error) {
    console.error('Error fetching athletes and attempts:', error);
    throw new Error('Failed to fetch athletes and attempts data');
  }
};

export const getPendingTestsWithAthletes = async (): Promise<TestAttemptWithAthlete[]> => {
  try {
    // Fetch all test attempts that are pending review
    const attemptsData = await client.fetch(`
      *[_type == "testAttempt" && status == "in-progress"] {
        _id,
        testType,
        userId,
        videoUrl,
        status,
        result,
        score,
        remarks,
        assessedBy,
        assessedAt,
        createdAt
      } | order(createdAt desc)
    `);

    // For each attempt, fetch the athlete information
    const attemptsWithAthletes = await Promise.all(
      attemptsData.map(async (attempt: TestAttempt) => {
        const athleteData = await client.fetch(`
          *[_type == "athlete" && (clerkId == $userId || _id == $userId)][0] {
            _id,
            name,
            age,
            gender,
            sport,
            height,
            weight,
            city,
            contact,
            clerkId,
            createdAt
          }
        `, { userId: attempt.userId });

        return {
          ...attempt,
          athlete: athleteData,
        };
      })
    );

    // Filter out attempts where athlete data is not found
    return attemptsWithAthletes.filter(attempt => attempt.athlete);
  } catch (error) {
    console.error('Error fetching pending tests:', error);
    throw new Error('Failed to fetch pending tests');
  }
};

export const getReviewedTestsWithAthletes = async (): Promise<TestAttemptWithAthlete[]> => {
  try {
    // Fetch all test attempts that have been reviewed (status = "done")
    const attemptsData = await client.fetch(`
      *[_type == "testAttempt" && status == "done"] {
        _id,
        testType,
        userId,
        videoUrl,
        status,
        result,
        score,
        remarks,
        assessedBy,
        assessedAt,
        createdAt
      } | order(assessedAt desc)
    `);

    // For each attempt, fetch the athlete information
    const attemptsWithAthletes = await Promise.all(
      attemptsData.map(async (attempt: TestAttempt) => {
        const athleteData = await client.fetch(`
          *[_type == "athlete" && (clerkId == $userId || _id == $userId)][0] {
            _id,
            name,
            age,
            gender,
            sport,
            height,
            weight,
            city,
            contact,
            clerkId,
            createdAt
          }
        `, { userId: attempt.userId });

        return {
          ...attempt,
          athlete: athleteData,
        };
      })
    );

    // Filter out attempts where athlete data is not found
    return attemptsWithAthletes.filter(attempt => attempt.athlete);
  } catch (error) {
    console.error('Error fetching reviewed tests:', error);
    throw new Error('Failed to fetch reviewed tests');
  }
};

export interface TestAttemptWithAthlete extends TestAttempt {
  athlete: AthleteProfile;
}

export const getAttemptStatistics = async () => {
  try {
    const stats = await client.fetch(`
      {
        "totalAttempts": count(*[_type == "testAttempt"]),
        "pendingAttempts": count(*[_type == "testAttempt" && status == "in-progress"]),
        "completedAttempts": count(*[_type == "testAttempt" && status == "done"]),
        "failedAttempts": count(*[_type == "testAttempt" && status == "failed"]),
        "totalAthletes": count(*[_type == "athlete"])
      }
    `);

    return stats;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw new Error('Failed to fetch statistics');
  }
};
