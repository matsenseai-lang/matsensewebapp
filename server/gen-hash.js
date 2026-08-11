// Quick script to generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password) {
  console.error('Usage: node gen-hash.js "your_new_password"');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 10);
console.log('\nBcrypt hash generated (password not repeated here for safety).');
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASS_HASH=${hash}`);
