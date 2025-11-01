import mysql from "mysql2/promise";

async function fixJoyBadges() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("Fixing joy badges for users with 70+ hours...");
  
  const [result] = await connection.execute(
    `UPDATE user_rank_snapshot 
     SET joyBadge = 1, joyGrantedAt = NOW() 
     WHERE totalHours >= 70 AND joyBadge = 0`
  );
  
  console.log(`✅ Updated ${(result as any).affectedRows} users with joy badges`);
  
  await connection.end();
}

fixJoyBadges()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
