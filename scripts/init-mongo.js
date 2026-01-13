// MongoDB initialization script for Docker container
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Create the appointment-system database
db = db.getSiblingDB('appointment-system');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('appointments');
db.createCollection('hubconfigs');
db.createCollection('appointmentslots');
db.createCollection('notifications');
db.createCollection('reports');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "closestHub.name": 1 });
db.users.createIndex({ "createdAt": -1 });

db.appointments.createIndex({ "userId": 1 }, { unique: true });
db.appointments.createIndex({ "hubName": 1 });
db.appointments.createIndex({ "appointmentDate": 1 });
db.appointments.createIndex({ "status": 1 });
db.appointments.createIndex({ "createdAt": -1 });

db.hubconfigs.createIndex({ "hubName": 1 }, { unique: true });

db.appointmentslots.createIndex({ "hubName": 1, "date": 1, "time": 1 });
db.appointmentslots.createIndex({ "isActive": 1 });

db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "hubName": 1 });
db.notifications.createIndex({ "createdAt": -1 });

db.reports.createIndex({ "type": 1 });
db.reports.createIndex({ "createdAt": -1 });

print('MongoDB initialization completed successfully!'); 