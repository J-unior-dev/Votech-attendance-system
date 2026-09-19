const readline = require("readline");
const bcrypt = require("bcryptjs");
const db = require("./config/db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createAdmin() {
  try {
    console.log("\n=== VSAMS ADMIN ACCOUNT SETUP ===\n");

    const name = await ask("Admin name: ");
    const username = await ask("Admin username: ");
    const password = await ask("Admin password: ");

    if (!name || !username || !password) {
      console.log("\nAll fields are required.");
      rl.close();
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO admins (name, username, password_hash, status)
       VALUES (?, ?, ?, 'Active')`,
      [name, username, passwordHash]
    );

    console.log("\n=================================");
    console.log("Admin account created successfully!");
    console.log("Admin ID:", result.insertId);
    console.log("Username:", username);
    console.log("=================================\n");

    await db.end();
    rl.close();
  } catch (error) {
    console.error("\nFailed to create admin:", error.message);

    await db.end();
    rl.close();
    process.exit(1);
  }
}

createAdmin();