import { Hono } from 'hono';
import { prisma } from '@studyquest/db';
import { errorResponse, jsonResponse } from '../lib/api-response.js';
import { getCurrentUserId } from '../lib/auth.js';
import { presentStudyLog } from '../presenters/api-presenters.js';

type StudyLogRequestBody = {
  questId?: unknown;
  minutes?: unknown;
  note?: unknown;
  studiedAt?: unknown;
};

export const studyLogsRoute = new Hono().post('/', async (c) => {
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
  const { questId, minutes, note, studiedAt } = validation.value;

  try {
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

    const studyLog = await prisma.$transaction(async (tx) => {
      const createdStudyLog = await tx.studyLog.create({
        data: {
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

      return createdStudyLog;
    });

    return jsonResponse({ studyLog: presentStudyLog(studyLog) }, 201);
  } catch {
    return errorResponse(
      'INTERNAL_SERVER_ERROR',
      '学習記録の作成に失敗しました。',
    );
  }
});

async function parseRequestBody(request: Request) {
  try {
    return (await request.json()) as StudyLogRequestBody;
  } catch {
    return null;
  }
}

function validateStudyLogRequest(body: StudyLogRequestBody):
  | {
      ok: true;
      value: {
        questId: string;
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

  if (typeof body.questId !== 'string' || body.questId.trim() === '') {
    details.push({
      field: 'questId',
      message: 'questIdは必須です。',
    });
  }

  if (
    typeof body.minutes !== 'number' ||
    !Number.isInteger(body.minutes) ||
    body.minutes <= 0
  ) {
    details.push({
      field: 'minutes',
      message: 'minutesは1以上の整数で指定してください。',
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

  if (Number.isNaN(studiedAt.getTime())) {
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
      minutes: Number(body.minutes),
      note: body.note === undefined ? undefined : String(body.note),
      studiedAt,
    },
  };
}
