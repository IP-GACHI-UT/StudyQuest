import type { Prisma } from '@studyquest/db';

type CompleteUserQuestParams = {
  tx: Prisma.TransactionClient;
  userId: string;
  userQuestId: string;
};

export async function completeUserQuestIfInProgress({
  tx,
  userId,
  userQuestId,
}: CompleteUserQuestParams) {
  const completedAt = new Date();
  const updateResult = await tx.userQuest.updateMany({
    where: {
      id: userQuestId,
      userId,
      status: 'IN_PROGRESS',
    },
    data: {
      status: 'COMPLETED',
      completedAt,
    },
  });

  if (updateResult.count !== 1) {
    return { completed: false };
  }

  const completedUserQuest = await tx.userQuest.findFirst({
    where: {
      id: userQuestId,
      userId,
    },
    select: {
      questId: true,
      quest: {
        select: {
          title: true,
          clearPoint: true,
          xpReward: true,
        },
      },
    },
  });

  if (!completedUserQuest) {
    throw new Error('Completed user quest was not found.');
  }

  await tx.user.update({
    where: {
      id: userId,
    },
    data: {
      totalPoints: {
        increment: completedUserQuest.quest.clearPoint,
      },
      totalXp: {
        increment: completedUserQuest.quest.xpReward,
      },
    },
  });

  await tx.activityLog.create({
    data: {
      userId,
      questId: completedUserQuest.questId,
      type: 'QUEST_COMPLETED',
      message: `「${completedUserQuest.quest.title}」を達成しました。`,
    },
  });

  return { completed: true };
}
