/* global process */
import bcrypt from 'bcryptjs';

const plainPassword = process.argv[2];

if (!plainPassword) {
  console.error('Usage: node server/scripts/hashPassword.js <plain-password>');
  process.exit(1);
}

const saltRounds = 10;
const hash = await bcrypt.hash(plainPassword, saltRounds);
console.log(hash);
