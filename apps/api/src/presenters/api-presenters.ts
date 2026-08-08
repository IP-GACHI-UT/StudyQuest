import type { Prisma, Quest, StudyLog, UserQuest } from '@studyquest/db';

export const profilePresenterSelect = {
  id: true,
  displayName: true,
  level: true,
  totalPoints: true,
  totalXp: true,
  userBadges: {
    orderBy: [{ earnedAt: 'desc' }, { id: 'desc' }],
    select: {
      earnedAt: true,
      badge: {
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export const activityPresenterSelect = {
  id: true,
  type: true,
  message: true,
  createdAt: true,
  user: {
    select: {
      displayName: true,
    },
  },
  quest: {
    select: {
      id: true,
      title: true,
    },
  },
} satisfies Prisma.ActivityLogSelect;

type ActivityForPresenter = Prisma.ActivityLogGetPayload<{
  select: typeof activityPresenterSelect;
}>;

type ProfileForPresenter = Prisma.UserGetPayload<{
  select: typeof profilePresenterSelect;
}>;

type ActivityType =
  | 'quest_accepted'
  | 'quest_completed'
  | 'study_log_created'
  | 'badge_earned';

const activityTypeMap = {
  QUEST_ACCEPTED: 'quest_accepted',
  QUEST_COMPLETED: 'quest_completed',
  STUDY_LOG_CREATED: 'study_log_created',
  BADGE_EARNED: 'badge_earned',
} as const satisfies Record<ActivityForPresenter['type'], ActivityType>;

export function presentProfile(
  profile: ProfileForPresenter,
  totalStudyMinutes: number,
) {
  return {
    id: profile.id,
    displayName: profile.displayName,
    level: profile.level,
    totalPoints: profile.totalPoints,
    totalXp: profile.totalXp,
    totalStudyMinutes,
    badges: profile.userBadges.map((userBadge) => ({
      id: userBadge.badge.id,
      name: userBadge.badge.name,
      description: userBadge.badge.description,
      icon: userBadge.badge.icon,
      earnedAt: userBadge.earnedAt,
    })),
  };
}

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

type QuestBoardStatistics = {
  acceptedToday: number;
  completedToday: number;
  completionRate: number;
};

/**
 * 掲示板用クエストをAPIレスポンス用に整形する
 * @param quest Quest
 * @param statistics 全ユーザーを対象としたクエスト集計
 * @param isAccepted 現在のユーザーが受注済みかどうか
 * @returns APIレスポンス用の掲示板クエストオブジェクト
 */
export function presentQuestBoardQuest(
  quest: Quest,
  statistics: QuestBoardStatistics,
  isAccepted: boolean,
) {
  return {
    quest: presentQuest(quest),
    statistics,
    currentUser: {
      isAccepted,
    },
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

/**
 * ActivityLogをAPIレスポンス用に整形する
 * @param activity ActivityLog
 * @returns APIレスポンス用のActivityオブジェクト
 */
export function presentActivity(activity: ActivityForPresenter) {
  return {
    id: activity.id,
    type: activityTypeMap[activity.type],
    message: activity.message,
    createdAt: activity.createdAt,
    user: {
      displayName: activity.user.displayName,
    },
    quest: activity.quest
      ? {
          id: activity.quest.id,
          title: activity.quest.title,
        }
      : null,
  };
}
