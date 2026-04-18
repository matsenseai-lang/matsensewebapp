// Quick script to generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'Matsenseai@1122';
const hash = bcrypt.hashSync(password, 10);
console.log('\nPassword:', password);
console.log('Bcrypt hash:', hash);
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASS_HASH=${hash}`);
