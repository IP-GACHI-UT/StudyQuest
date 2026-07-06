require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, QuestDifficulty } = require('@prisma/client');

const DEVELOPMENT_USER_ID = 'dev-user-001';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const devUser = {
  id: DEVELOPMENT_USER_ID,
  displayName: '開発用ユーザー',
  email: 'dev@example.com',
};

const devQuests = [
  {
    id: 'dev-quest-html-001',
    title: 'HTMLの基本タグを復習する',
    description:
      '見出し、段落、リンク、リストのタグを使って小さな自己紹介ページを作る。',
    category: 'プログラミング',
    difficulty: QuestDifficulty.EASY,
    estimatedMinutes: 15,
    acceptPoint: 5,
    clearPoint: 20,
    xpReward: 30,
    isActive: true,
  },
  {
    id: 'dev-quest-css-001',
    title: 'CSSでカードUIを整える',
    description: '余白、色、枠線、影を調整して、読みやすいカードUIを1つ作る。',
    category: 'プログラミング',
    difficulty: QuestDifficulty.NORMAL,
    estimatedMinutes: 30,
    acceptPoint: 10,
    clearPoint: 35,
    xpReward: 55,
    isActive: true,
  },
  {
    id: 'dev-quest-ts-001',
    title: 'TypeScriptの型注釈を練習する',
    description:
      '文字列、数値、配列、オブジェクトに型を付ける小さな関数を書く。',
    category: 'プログラミング',
    difficulty: QuestDifficulty.NORMAL,
    estimatedMinutes: 40,
    acceptPoint: 12,
    clearPoint: 45,
    xpReward: 70,
    isActive: true,
  },
  {
    id: 'dev-quest-next-001',
    title: 'Next.jsのRoute Handlerを読む',
    description:
      '既存APIのRoute Handlerを1つ読み、入力、処理、レスポンス形式をメモする。',
    category: 'プログラミング',
    difficulty: QuestDifficulty.HARD,
    estimatedMinutes: 60,
    acceptPoint: 20,
    clearPoint: 70,
    xpReward: 110,
    isActive: true,
  },
  {
    id: 'dev-quest-english-001',
    title: '英単語を10個復習する',
    description: '最近見た英単語を10個選び、意味と例文を声に出して確認する。',
    category: '英語',
    difficulty: QuestDifficulty.EASY,
    estimatedMinutes: 10,
    acceptPoint: 5,
    clearPoint: 15,
    xpReward: 25,
    isActive: true,
  },
  {
    id: 'dev-quest-reading-001',
    title: '技術記事を1本読む',
    description: '気になる技術記事を1本読み、学んだことを3行でまとめる。',
    category: '読書',
    difficulty: QuestDifficulty.NORMAL,
    estimatedMinutes: 25,
    acceptPoint: 8,
    clearPoint: 30,
    xpReward: 45,
    isActive: true,
  },
  {
    id: 'dev-quest-cert-001',
    title: '資格試験の過去問を解く',
    description: '資格学習の過去問を5問解き、間違えた理由を確認する。',
    category: '資格学習',
    difficulty: QuestDifficulty.HARD,
    estimatedMinutes: 45,
    acceptPoint: 15,
    clearPoint: 55,
    xpReward: 90,
    isActive: true,
  },
  {
    id: 'dev-quest-habit-001',
    title: '5分だけ学習を始める',
    description: 'タイマーを5分に設定し、教材を開いて学習を始める。',
    category: '習慣化',
    difficulty: QuestDifficulty.EASY,
    estimatedMinutes: 5,
    acceptPoint: 3,
    clearPoint: 10,
    xpReward: 15,
    isActive: true,
  },
];

async function main() {
  await prisma.user.upsert({
    where: { id: devUser.id },
    update: {
      displayName: devUser.displayName,
      email: devUser.email,
    },
    create: devUser,
  });

  for (const quest of devQuests) {
    const { id, ...questData } = quest;

    await prisma.quest.upsert({
      where: { id },
      update: questData,
      create: {
        id,
        ...questData,
      },
    });
  }

  console.log(
    `Seed completed: 1 development user and ${devQuests.length} development quests are ready.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
