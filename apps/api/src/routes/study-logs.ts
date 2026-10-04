import { prisma } from '@studyquest/db';
import { Hono } from 'hono';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { getCurrentUserId } from '../lib/auth.js';
import { presentStudyLog } from '../presenters/api-presenters.js';
import { completeUserQuestIfInProgress } from '../services/quest-completion.js';

type StudyLogRequestBody = {
  requestId?: unknown;
  questId?: unknown;
  minutes?: unknown;
  note?: unknown;
  studiedAt?: unknown;
};

export const studyLogsRoute = new Hono()
  .get('/', async () => {
    const userId = await getCurrentUserId();
    try {
      const studyLogs = await prisma.studyLog.findMany({
        where: { userId },
        orderBy: [{ studiedAt: 'desc' }, { id: 'desc' }],
      });
      return jsonResponse({ studyLogs: studyLogs.map(presentStudyLog) });
    } catch {
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        '学習記録の取得に失敗しました。',
      );
    }
  })
  .post('/', async (c) => {
    const body = await parseRequestBody(c.req.raw);

    if (!body) {
      return errorResponse(
        'INVALID_REQUEST_BODY',
        'リクエストボディはJSONで送信してください。',
        400,
      );
    }

    const validation = validateStudyLogRequest(body);

    if (!validation.ok) {
      return errorResponse(
        'VALIDATION_ERROR',
        '学習記録の入力内容を確認してください。',
        400,
        validation.details,
      );
    }

    const userId = await getCurrentUserId();
    const { questId, minutes, note, studiedAt, requestId } = validation.value;
    // 任意の再送キーを既存の主キーへ格納し、DBの一意制約で同時送信も防ぐ。
    const logId = requestId ? `study-${requestId}` : undefined;
    async function replayResponse() {
      if (!logId) return null;
      const existing = await prisma.studyLog.findUnique({
        where: { id: logId },
      });
      if (!existing) return null;
      if (
        existing.userId !== userId ||
        existing.questId !== questId ||
        existing.minutes !== minutes ||
        existing.note !== (note ?? null) ||
        (body?.studiedAt !== undefined &&
          existing.studiedAt.getTime() !== studiedAt.getTime())
      ) {
        return errorResponse(
          'REQUEST_ID_CONFLICT',
          '同じ送信IDで異なる学習記録を保存できません。',
          409,
        );
      }
      return jsonResponse({ studyLog: presentStudyLog(existing) }, 201);
    }

    try {
      const replay = await replayResponse();
      if (replay) return replay;
      const userQuest = await prisma.userQuest.findUnique({
        where: {
          userId_questId: {
            userId,
            questId,
          },
        },
        include: {
          quest: {
            select: {
              title: true,
              estimatedMinutes: true,
            },
          },
        },
      });

      if (!userQuest) {
        return errorResponse(
          'QUEST_NOT_ACCEPTED',
          '学習記録を作成するには、先にクエストを受注してください。',
          400,
        );
      }
      if (userQuest.status === 'CANCELED') {
        return errorResponse(
          'QUEST_CANCELED',
          'キャンセル済みのクエストには記録できません。',
          400,
        );
      }

      const studyLog = await prisma.$transaction(async (tx) => {
        // 同じクエストの記録を直列化し、同時保存でも累積時間の閾値を見落とさない。
        await tx.$queryRaw`SELECT id FROM user_quests WHERE id = ${userQuest.id} FOR UPDATE`;
        const createdStudyLog = await tx.studyLog.create({
          data: {
            id: logId,
            userId,
            questId,
            userQuestId: userQuest.id,
            minutes,
            note,
            studiedAt,
          },
        });

        await tx.activityLog.create({
          data: {
            userId,
            questId,
            type: 'STUDY_LOG_CREATED',
            message: `「${userQuest.quest.title}」の学習を${minutes}分記録しました。`,
          },
        });

        const studyMinutes = await tx.studyLog.aggregate({
          where: {
            userId,
            userQuestId: userQuest.id,
          },
          _sum: {
            minutes: true,
          },
        });

        const totalStudyMinutes = studyMinutes._sum.minutes ?? 0;

        if (totalStudyMinutes >= userQuest.quest.estimatedMinutes) {
          await completeUserQuestIfInProgress({
            tx,
            userId,
            userQuestId: userQuest.id,
          });
        }

        return createdStudyLog;
      });

      return jsonResponse({ studyLog: presentStudyLog(studyLog) }, 201);
    } catch {
      try {
        // 応答が失われた場合や一意制約で競合した場合も、確定済みの結果を返す。
        const replay = await replayResponse();
        if (replay) return replay;
      } catch {
        // DB障害の詳細を公開しない。
      }
      return errorResponse(
        'INTERNAL_SERVER_ERROR',
        '学習記録の作成に失敗しました。',
      );
    }
  });

async function parseRequestBody(request: Request) {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body)
      ? (body as StudyLogRequestBody)
      : null;
  } catch {
    return null;
  }
}

function validateStudyLogRequest(body: StudyLogRequestBody):
  | {
      ok: true;
      value: {
        questId: string;
        requestId?: string;
        minutes: number;
        note?: string;
        studiedAt: Date;
      };
    }
  | {
      ok: false;
      details: { field: string; message: string }[];
    } {
  const details: { field: string; message: string }[] = [];

  if (
    body.requestId !== undefined &&
    (typeof body.requestId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.requestId,
      ))
  ) {
    details.push({
      field: 'requestId',
      message: 'requestIdはUUID v4で指定してください。',
    });
  }

  if (typeof body.questId !== 'string' || body.questId.trim() === '') {
    details.push({
      field: 'questId',
      message: 'questIdは必須です。',
    });
  }

  if (
    typeof body.minutes !== 'number' ||
    !Number.isInteger(body.minutes) ||
    body.minutes <= 0 ||
    body.minutes > 1440
  ) {
    details.push({
      field: 'minutes',
      message: 'minutesは1〜1440の整数で指定してください。',
    });
  }

  if (body.note !== undefined && typeof body.note !== 'string') {
    details.push({
      field: 'note',
      message: 'noteは文字列で指定してください。',
    });
  }

  const studiedAt =
    body.studiedAt === undefined
      ? new Date()
      : new Date(String(body.studiedAt));

  if (
    (body.studiedAt !== undefined &&
      (typeof body.studiedAt !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
          body.studiedAt,
        ) ||
        !hasValidCalendarDate(body.studiedAt))) ||
    Number.isNaN(studiedAt.getTime())
  ) {
    details.push({
      field: 'studiedAt',
      message: 'studiedAtは日時として解釈できる文字列で指定してください。',
    });
  }

  if (details.length > 0) {
    return { ok: false, details };
  }

  return {
    ok: true,
    value: {
      questId: String(body.questId),
      requestId:
        body.requestId === undefined ? undefined : String(body.requestId),
      minutes: Number(body.minutes),
      note: body.note === undefined ? undefined : String(body.note),
      studiedAt,
    },
  };
}

function hasValidCalendarDate(value: string) {
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === datePart
  );
}
