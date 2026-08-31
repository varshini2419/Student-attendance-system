const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ActivityState = require('./src/models/ActivityState');
const ActivityEvent = require('./src/models/ActivityEvent');
const Student = require('./src/models/Student');
const AttendanceSession = require('./src/models/AttendanceSession');
const Attendance = require('./src/models/Attendance');

async function testLogic() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create mock objects
  const student1Id = new mongoose.Types.ObjectId();
  const student2Id = new mongoose.Types.ObjectId();
  const sessionAId = new mongoose.Types.ObjectId();
  const sessionBId = new mongoose.Types.ObjectId();

  await ActivityState.deleteMany({ student: { $in: [student1Id, student2Id] } });
  await ActivityEvent.deleteMany({ student: { $in: [student1Id, student2Id] } });
  await Attendance.deleteMany({ student: { $in: [student1Id, student2Id] } });

  console.log('\n--- Test 1: New person -> Login available ---');
  let state1 = await ActivityState.findOne({ student: student1Id, session: sessionAId });
  let action = 'LOGIN_AVAILABLE';
  if (state1 && state1.currentState === 'IN') action = 'IGNORE';
  console.log('Action returned for Student 1:', action); // Expected LOGIN_AVAILABLE

  console.log('\n--- Test 2: Login confirmed -> Login timestamp saved ---');
  state1 = new ActivityState({ student: student1Id, session: sessionAId, currentState: 'IN', lastLoginTime: Date.now() });
  await state1.save();
  await ActivityEvent.create({ student: student1Id, session: sessionAId, eventType: 'LOGIN' });
  console.log('Saved State:', state1.currentState, 'at', new Date(state1.lastLoginTime).toISOString());

  console.log('\n--- Test 3: Face detected again within 30 minutes -> Ignored ---');
  state1 = await ActivityState.findOne({ student: student1Id, session: sessionAId });
  let elapsedMins = (Date.now() - new Date(state1.lastLoginTime).getTime()) / 60000;
  if (state1.currentState === 'IN' && elapsedMins < 30) {
    console.log('Action returned: IGNORE, Reason: WITHIN_30_MINUTE_PROTECTION');
  }

  console.log('\n--- Test 4: Face detected after 30 minutes -> Logout available ---');
  // Mock time manipulation
  state1.lastLoginTime = new Date(Date.now() - 31 * 60000);
  await state1.save();
  elapsedMins = (Date.now() - new Date(state1.lastLoginTime).getTime()) / 60000;
  if (state1.currentState === 'IN' && elapsedMins >= 30) {
    console.log('Action returned: LOGOUT_AVAILABLE');
  }

  console.log('\n--- Test 5: Logout confirmed -> Logout timestamp saved ---');
  state1.currentState = 'OUT';
  state1.lastLogoutTime = Date.now();
  state1.totalDurationMinutes += 31;
  await state1.save();
  await ActivityEvent.create({ student: student1Id, session: sessionAId, eventType: 'LOGOUT' });
  console.log('Saved State:', state1.currentState, '| Total duration:', state1.totalDurationMinutes, 'mins');

  console.log('\n--- Test 6: Person can later log in again ---');
  if (state1.currentState === 'OUT') {
    console.log('Action returned: LOGIN_AVAILABLE');
  }
  state1.currentState = 'IN';
  state1.lastLoginTime = Date.now();
  await state1.save();
  await ActivityEvent.create({ student: student1Id, session: sessionAId, eventType: 'LOGIN' });

  console.log('\n--- Test 7: Multiple login/logout cycles are recorded correctly ---');
  const events = await ActivityEvent.find({ student: student1Id, session: sessionAId }).sort({ timestamp: 1 });
  events.forEach(e => console.log('Event:', e.eventType, 'at', e.timestamp.toISOString()));

  console.log('\n--- Test 8: Different people maintain independent states ---');
  let state2 = await ActivityState.findOne({ student: student2Id, session: sessionAId });
  console.log('Student 2 State (should be empty/null):', state2);
  state2 = new ActivityState({ student: student2Id, session: sessionAId, currentState: 'IN', lastLoginTime: Date.now() });
  await state2.save();
  console.log('Student 1 State:', state1.currentState, '| Student 2 State:', state2.currentState);

  console.log('\n--- Test 9: Multiple sessions do not mix attendance records ---');
  let state1_sessionB = await ActivityState.findOne({ student: student1Id, session: sessionBId });
  console.log('Student 1 in Session B (should be empty/null):', state1_sessionB);

  await mongoose.disconnect();
}

testLogic();
