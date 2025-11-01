import mysql from "mysql2/promise";
import { updateUserRankSnapshot } from "../server/services/rank";

async function fixTestSnapshots() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [users] = await conn.execute('SELECT id FROM users WHERE openId LIKE "VTEST%"');
  
  for (const user of users as any[]) {
    await updateUserRankSnapshot(user.id);
    console.log(`✅ Created rank snapshot for user ${user.id}`);
  }
  
  await conn.end();
}

fixTestSnapshots()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
