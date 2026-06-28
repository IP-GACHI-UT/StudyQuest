import type { Quest, StudyLog, UserQuest } from '@prisma/client';

export function presentQuest(quest: Quest) {
  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    category: quest.category,
    difficulty: quest.difficulty.toLowerCase(),
    estimatedMinutes: quest.estimatedMinutes,
    acceptPoint: quest.acceptPoint,
    clearPoint: quest.clearPoint,
    xpReward: quest.xpReward,
    isActive: quest.isActive,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
  };
}

export function presentUserQuest(userQuest: UserQuest & { quest: Quest }) {
  return {
    id: userQuest.id,
    status: userQuest.status.toLowerCase(),
    acceptedAt: userQuest.acceptedAt,
    completedAt: userQuest.completedAt,
    quest: presentQuest(userQuest.quest),
  };
}

export function presentStudyLog(studyLog: StudyLog) {
  return {
    id: studyLog.id,
    userId: studyLog.userId,
    questId: studyLog.questId,
    minutes: studyLog.minutes,
    note: studyLog.note,
    studiedAt: studyLog.studiedAt,
    createdAt: studyLog.createdAt,
  };
}
