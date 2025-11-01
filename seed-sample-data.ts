/**
 * Seed sample data for development and testing
 * Run with: tsx scripts/seed-sample-data.ts
 */

import { getDb } from "../server/db";
import { departments, badges } from "../drizzle/schema";

async function seedSampleData() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  console.log("🌱 Seeding sample data...\n");

  // Clear existing data
  console.log("Clearing existing departments and badges...");
  await db.delete(departments);
  await db.delete(badges);

  // Seed hierarchical departments
  console.log("\n📁 Creating hierarchical departments...");
  
  // Level 1: 方丈助理
  const [assistant1] = await db.insert(departments).values({
    name: "方丈助理1",
    level: 1,
    parentId: null,
    fullPath: "方丈助理1",
    displayOrder: 1,
  }).$returningId();

  const [assistant2] = await db.insert(departments).values({
    name: "方丈助理2",
    level: 1,
    parentId: null,
    fullPath: "方丈助理2",
    displayOrder: 2,
  }).$returningId();

  // Level 2: Centers under 方丈助理1
  const [meditationCenter] = await db.insert(departments).values({
    name: "禅修中心",
    level: 2,
    parentId: assistant1.id,
    fullPath: "方丈助理1/禅修中心",
    displayOrder: 1,
  }).$returningId();

  const [cultureCenter] = await db.insert(departments).values({
    name: "文化中心",
    level: 2,
    parentId: assistant1.id,
    fullPath: "方丈助理1/文化中心",
    displayOrder: 2,
  }).$returningId();

  const [volunteerCenter] = await db.insert(departments).values({
    name: "义工中心",
    level: 2,
    parentId: assistant1.id,
    fullPath: "方丈助理1/义工中心",
    displayOrder: 3,
  }).$returningId();

  // Level 2: Centers under 方丈助理2
  const [templeAffairsCenter] = await db.insert(departments).values({
    name: "寺务中心",
    level: 2,
    parentId: assistant2.id,
    fullPath: "方丈助理2/寺务中心",
    displayOrder: 1,
  }).$returningId();

  const [newBuilding] = await db.insert(departments).values({
    name: "新楼",
    level: 2,
    parentId: assistant2.id,
    fullPath: "方丈助理2/新楼",
    displayOrder: 2,
  }).$returningId();

  // Level 3: Departments under 禅修中心
  await db.insert(departments).values([
    {
      name: "客堂",
      level: 3,
      parentId: meditationCenter.id,
      fullPath: "方丈助理1/禅修中心/客堂",
      displayOrder: 1,
    },
    {
      name: "客房部",
      level: 3,
      parentId: meditationCenter.id,
      fullPath: "方丈助理1/禅修中心/客房部",
      displayOrder: 2,
    },
    {
      name: "福田办",
      level: 3,
      parentId: meditationCenter.id,
      fullPath: "方丈助理1/禅修中心/福田办",
      displayOrder: 3,
    },
    {
      name: "禅修办",
      level: 3,
      parentId: meditationCenter.id,
      fullPath: "方丈助理1/禅修中心/禅修办",
      displayOrder: 4,
    },
  ]);

  // Level 3: Departments under 文化中心
  await db.insert(departments).values([
    {
      name: "文创中心",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/文创中心",
      displayOrder: 1,
    },
    {
      name: "本然茶空间",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/本然茶空间",
      displayOrder: 2,
    },
    {
      name: "咖啡馆",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/咖啡馆",
      displayOrder: 3,
    },
    {
      name: "福满堂",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/福满堂",
      displayOrder: 4,
    },
    {
      name: "图书馆",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/图书馆",
      displayOrder: 5,
    },
    {
      name: "文宣中心",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/文宣中心",
      displayOrder: 6,
    },
    {
      name: "财务部",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/财务部",
      displayOrder: 7,
    },
    {
      name: "福善中心",
      level: 3,
      parentId: cultureCenter.id,
      fullPath: "方丈助理1/文化中心/福善中心",
      displayOrder: 8,
    },
  ]);

  // Level 3: Departments under 义工中心
  await db.insert(departments).values({
    name: "斋堂",
    level: 3,
    parentId: volunteerCenter.id,
    fullPath: "方丈助理1/义工中心/斋堂",
    displayOrder: 1,
  });

  // Level 3: Departments under 寺务中心
  await db.insert(departments).values([
    {
      name: "维修部",
      level: 3,
      parentId: templeAffairsCenter.id,
      fullPath: "方丈助理2/寺务中心/维修部",
      displayOrder: 1,
    },
    {
      name: "综治办",
      level: 3,
      parentId: templeAffairsCenter.id,
      fullPath: "方丈助理2/寺务中心/综治办",
      displayOrder: 2,
    },
    {
      name: "园林",
      level: 3,
      parentId: templeAffairsCenter.id,
      fullPath: "方丈助理2/寺务中心/园林",
      displayOrder: 3,
    },
    {
      name: "菜地",
      level: 3,
      parentId: templeAffairsCenter.id,
      fullPath: "方丈助理2/寺务中心/菜地",
      displayOrder: 4,
    },
    {
      name: "采购",
      level: 3,
      parentId: templeAffairsCenter.id,
      fullPath: "方丈助理2/寺务中心/采购",
      displayOrder: 5,
    },
  ]);

  // Level 3: Departments under 新楼
  await db.insert(departments).values([
    {
      name: "中轴线",
      level: 3,
      parentId: newBuilding.id,
      fullPath: "方丈助理2/新楼/中轴线",
      displayOrder: 1,
    },
    {
      name: "十方面馆",
      level: 3,
      parentId: newBuilding.id,
      fullPath: "方丈助理2/新楼/十方面馆",
      displayOrder: 2,
    },
  ]);

  console.log("✅ Created 27 departments in hierarchical structure");

  // Seed badges
  console.log("\n🏅 Creating badge definitions...");

  await db.insert(badges).values([
    {
      code: "joy_badge",
      name: "欢喜徽记",
      description: "累计服务满70小时自动授予，象征长期奉献精神",
      category: "service_hours",
      autoGrantRule: JSON.stringify({
        type: "service_hours",
        threshold: 70,
      }),
      displayOrder: 1,
      status: "active",
    },
    {
      code: "temple_worker_1year",
      name: "寺工满一年",
      description: "成为寺院工作人员满一年授予，可享受特殊权益（如入住弥陀村）",
      category: "engagement_duration",
      autoGrantRule: JSON.stringify({
        type: "engagement_duration",
        engagementType: "temple_worker",
        durationDays: 365,
      }),
      displayOrder: 2,
      status: "active",
    },
    {
      code: "volunteer_100hours",
      name: "百时奉献",
      description: "累计服务满100小时授予",
      category: "service_hours",
      autoGrantRule: JSON.stringify({
        type: "service_hours",
        threshold: 100,
      }),
      displayOrder: 3,
      status: "active",
    },
    {
      code: "volunteer_500hours",
      name: "五百时菩萨行",
      description: "累计服务满500小时授予，资深志愿者专属",
      category: "service_hours",
      autoGrantRule: JSON.stringify({
        type: "service_hours",
        threshold: 500,
      }),
      displayOrder: 4,
      status: "active",
    },
    {
      code: "special_contribution",
      name: "特殊贡献",
      description: "对寺院做出特殊贡献，由管理员手动授予",
      category: "special",
      autoGrantRule: null,
      displayOrder: 5,
      status: "active",
    },
  ]);

  console.log("✅ Created 5 badge definitions");

  console.log("\n✨ Sample data seeding completed!\n");
  process.exit(0);
}

seedSampleData().catch((error) => {
  console.error("❌ Error seeding sample data:", error);
  process.exit(1);
});
