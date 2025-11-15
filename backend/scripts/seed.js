/**
 * Seed Script - Create sample hospitals for testing
 * Run: node scripts/seed.js
 */

import mongoose from "mongoose";
import Hospital from "../src/models/Hospital.js";
import { hashPassword } from "../src/utils/hash.js";
import config from "../src/config/env.js";

const sampleHospitals = [
  {
    hospitalName: "City Medical Center",
    email: "admin@citymedical.com",
    phone: "+919876543210",
    password: "Password123",
    logoUrl: "https://via.placeholder.com/150?text=City+Medical",
    department: "General",
    address: "123 Medical Lane",
    city: "Mumbai",
    state: "Maharashtra",
    zipCode: "400001",
  },
  {
    hospitalName: "Green Valley Hospital",
    email: "admin@greenvalley.com",
    phone: "+919876543211",
    password: "Password123",
    logoUrl: "https://via.placeholder.com/150?text=Green+Valley",
    department: "Cardiology",
    address: "456 Health Street",
    city: "Bangalore",
    state: "Karnataka",
    zipCode: "560001",
  },
  {
    hospitalName: "Royal Care Hospital",
    email: "admin@royalcare.com",
    phone: "+919876543212",
    password: "Password123",
    logoUrl: "https://via.placeholder.com/150?text=Royal+Care",
    department: "Orthopedics",
    address: "789 Wellness Road",
    city: "Delhi",
    state: "Delhi",
    zipCode: "110001",
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Clear existing hospitals
    await Hospital.deleteMany({});
    console.log("✓ Cleared existing hospitals");

    // Hash passwords and create hospitals
    const hospitalsToCreate = await Promise.all(
      sampleHospitals.map(async (hospital) => ({
        ...hospital,
        passwordHash: await hashPassword(hospital.password),
      })),
    );

    // Remove password field (already hashed)
    hospitalsToCreate.forEach((h) => delete h.password);

    // Insert hospitals
    const created = await Hospital.insertMany(hospitalsToCreate);
    console.log(`✓ Created ${created.length} sample hospitals`);

    // Log created hospitals
    created.forEach((hospital) => {
      console.log(`  - ${hospital.hospitalName} (${hospital.email})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("✗ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
