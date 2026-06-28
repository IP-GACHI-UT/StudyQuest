import type { Quest, StudyLog, UserQuest } from '@prisma/client';

/**
 * QuestをAPIレスポンス用に整形する
 * @param quest Quest
 * @returns APIレスポンス用のQuestオブジェクト
 */
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

/**
 * UserQuestをAPIレスポンス用に整形する
 * @param userQuest UserQuest & { quest: Quest }
 * @returns APIレスポンス用のUserQuestオブジェクト
 */
export function presentUserQuest(userQuest: UserQuest & { quest: Quest }) {
  return {
    id: userQuest.id,
    status: userQuest.status.toLowerCase(),
    acceptedAt: userQuest.acceptedAt,
    completedAt: userQuest.completedAt,
    quest: presentQuest(userQuest.quest),
  };
}

/**
 * StudyLogをAPIレスポンス用に整形する
 * @param studyLog StudyLog
 * @returns APIレスポンス用のStudyLogオブジェクト
 */
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
