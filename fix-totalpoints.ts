import mysql from "mysql2/promise";

async function fixTotalPoints() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  await connection.execute(
    "ALTER TABLE user_rank_snapshot MODIFY totalPoints INT NOT NULL DEFAULT 0"
  );
  await connection.end();
  console.log("✓ Updated totalPoints column to INT");
}

fixTotalPoints();
