// Comprehensive End-to-End API Integration Test Suite for HappenStance

const BASE_URL = "http://localhost:8080/api/v1";

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, data: json || text };
}

async function get(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, data: json || text };
}

async function put(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, data: json || text };
}

async function patch(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, data: json || text };
}

async function del(path, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "DELETE",
    headers,
  });
  return { status: res.status, ok: res.ok };
}

async function run() {
  console.log("=== HAPPENSTANCE INTEGRATION TEST SUITE ===\n");

  const timestamp = Date.now();
  const users = {
    alice: { displayName: "Alice Johnson", email: `alice_${timestamp}@example.com`, password: "SecurePassword123!" },
    bob: { displayName: "Bob Smith", email: `bob_${timestamp}@example.com`, password: "SecurePassword123!" },
    charlie: { displayName: "Charlie Davis", email: `charlie_${timestamp}@example.com`, password: "SecurePassword123!" },
    diana: { displayName: "Diana Prince", email: `diana_${timestamp}@example.com`, password: "SecurePassword123!" },
    evan: { displayName: "Evan Wright", email: `evan_${timestamp}@example.com`, password: "SecurePassword123!" },
  };

  // 1. Password validation test: reject password < 12 characters
  console.log("1. Testing Password Validation (< 12 characters)...");
  const shortPassRes = await post("/auth/register", {
    displayName: "Short Pass",
    email: `short_${timestamp}@example.com`,
    password: "shortpass",
  });
  if (shortPassRes.status === 400) {
    console.log("   ✓ Correctly rejected short password (< 12 chars) with 400 Bad Request");
  } else {
    console.error("   ✗ FAILED short password check:", shortPassRes);
    process.exit(1);
  }

  // 2. Register all test users
  console.log("\n2. Registering test accounts...");
  for (const [key, u] of Object.entries(users)) {
    const regRes = await post("/auth/register", u);
    if (!regRes.ok) {
      console.error(`   ✗ Failed to register ${key}:`, regRes);
      process.exit(1);
    }
    u.token = regRes.data.accessToken;
    u.id = regRes.data.user.id;
    console.log(`   ✓ Registered ${u.displayName} (ID: ${u.id})`);
  }

  // 3. Test duplicate email rejection
  console.log("\n3. Testing Duplicate Email Registration...");
  const dupRes = await post("/auth/register", users.alice);
  if (dupRes.status === 409) {
    console.log("   ✓ Correctly rejected duplicate email with 409 Conflict");
  } else {
    console.error("   ✗ FAILED duplicate email check:", dupRes);
    process.exit(1);
  }

  // 4. Test Login
  console.log("\n4. Testing Login API...");
  const loginRes = await post("/auth/login", {
    email: users.alice.email,
    password: users.alice.password,
  });
  if (loginRes.ok && loginRes.data.accessToken) {
    console.log("   ✓ Login successful, JWT access token received");
  } else {
    console.error("   ✗ FAILED login check:", loginRes);
    process.exit(1);
  }

  const badLoginRes = await post("/auth/login", {
    email: users.alice.email,
    password: "WrongPassword999!",
  });
  if (badLoginRes.status === 401) {
    console.log("   ✓ Correctly rejected invalid credentials with 401 Unauthorized");
  } else {
    console.error("   ✗ FAILED bad login check:", badLoginRes);
    process.exit(1);
  }

  // 5. Populate and Update Profiles
  console.log("\n5. Updating User Profiles...");
  const profileData = {
    alice: {
      headline: "Senior Full-Stack Engineer",
      bio: "Passionate about distributed systems, React, and Spring Boot.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["React", "TypeScript", "Java", "Spring Boot"],
      interests: ["Open Source", "System Architecture"],
      visibility: "PUBLIC",
    },
    bob: {
      headline: "Staff Infrastructure Architect",
      bio: "Cloud native infrastructure and Kubernetes enthusiast.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["Java", "Docker", "MongoDB", "Kubernetes"],
      interests: ["Cloud Infrastructure", "Security"],
      visibility: "PUBLIC",
    },
    charlie: {
      headline: "Principal Product Designer",
      bio: "Building accessible and intuitive design systems.",
      location: "New York, NY",
      industry: "Design",
      skills: ["UI/UX", "Figma", "Design Systems", "React"],
      interests: ["Design Systems", "Accessibility"],
      visibility: "PUBLIC",
    },
    diana: {
      headline: "Engineering Director",
      bio: "Scaling teams and high-throughput backend services.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["Engineering Management", "Spring Boot", "Distributed Systems"],
      interests: ["Leadership", "Mentorship"],
      visibility: "PUBLIC",
    },
    evan: {
      headline: "Data Scientist",
      bio: "Exploring graph embeddings and predictive analytics.",
      location: "Austin, TX",
      industry: "Data Science",
      skills: ["Python", "Machine Learning", "Data Analysis"],
      interests: ["AI", "Neural Networks"],
      visibility: "PUBLIC",
    },
  };

  for (const [key, p] of Object.entries(profileData)) {
    const updateRes = await put("/profiles/me", p, users[key].token);
    if (!updateRes.ok) {
      console.error(`   ✗ Failed to update profile for ${key}:`, updateRes);
      process.exit(1);
    }
    console.log(`   ✓ Profile updated for ${users[key].displayName}: "${updateRes.data.headline}"`);
  }

  // 6. Connect Relationships:
  // Alice -> Bob (Accepted)
  // Alice -> Charlie (Accepted)
  // Diana -> Bob (Accepted)
  // Diana -> Charlie (Accepted)
  // Diana -> Evan (Pending)
  // Alice -> Evan (Rejected)
  console.log("\n6. Establishing Network Relationships...");

  // Alice connects to Bob
  const reqAB = await post(`/relationships/${users.bob.id}`, {}, users.alice.token);
  await patch(`/relationships/${reqAB.data.id}/accept`, {}, users.bob.token);
  console.log("   ✓ Alice <-> Bob connected (ACCEPTED)");

  // Alice connects to Charlie
  const reqAC = await post(`/relationships/${users.charlie.id}`, {}, users.alice.token);
  await patch(`/relationships/${reqAC.data.id}/accept`, {}, users.charlie.token);
  console.log("   ✓ Alice <-> Charlie connected (ACCEPTED)");

  // Diana connects to Bob
  const reqDB = await post(`/relationships/${users.bob.id}`, {}, users.diana.token);
  await patch(`/relationships/${reqDB.data.id}/accept`, {}, users.bob.token);
  console.log("   ✓ Diana <-> Bob connected (ACCEPTED)");

  // Diana connects to Charlie
  const reqDC = await post(`/relationships/${users.charlie.id}`, {}, users.diana.token);
  await patch(`/relationships/${reqDC.data.id}/accept`, {}, users.charlie.token);
  console.log("   ✓ Diana <-> Charlie connected (ACCEPTED)");

  // Diana sends to Evan (stays PENDING)
  await post(`/relationships/${users.evan.id}`, {}, users.diana.token);
  console.log("   ✓ Diana -> Evan request sent (PENDING)");

  // Alice sends to Evan, Evan rejects
  const reqAE = await post(`/relationships/${users.evan.id}`, {}, users.alice.token);
  await patch(`/relationships/${reqAE.data.id}/reject`, {}, users.evan.token);
  console.log("   ✓ Alice -> Evan rejected (REJECTED)");

  // 7. Verify Mutual Connections Engine
  console.log("\n7. Testing Mutual Connections Engine...");
  const mutualRes = await get(`/relationships/mutual/${users.diana.id}`, users.alice.token);
  if (!mutualRes.ok) {
    console.error("   ✗ Mutual connections request failed:", mutualRes);
    process.exit(1);
  }

  console.log("   Response from GET /relationships/mutual/{dianaId}:", JSON.stringify(mutualRes.data, null, 2));

  if (mutualRes.data.count !== 2) {
    console.error(`   ✗ Expected 2 mutual connections, got ${mutualRes.data.count}`);
    process.exit(1);
  }

  const mutualNames = mutualRes.data.mutualConnections.map(m => m.displayName).sort();
  if (mutualNames[0] === "Bob Smith" && mutualNames[1] === "Charlie Davis") {
    console.log("   ✓ ACCURATE MUTUAL CONNECTIONS: Bob Smith & Charlie Davis identified!");
  } else {
    console.error("   ✗ Unexpected mutual connection members:", mutualNames);
    process.exit(1);
  }

  // 8. Self-profile mutual connections check
  const selfMutualRes = await get(`/relationships/mutual/${users.alice.id}`, users.alice.token);
  if (selfMutualRes.ok && selfMutualRes.data.count === 0) {
    console.log("   ✓ Self mutual connections correctly returns 0");
  } else {
    console.error("   ✗ Self mutual connections unexpected response:", selfMutualRes);
    process.exit(1);
  }

  // 9. Remove connection test: Diana removes Charlie
  console.log("\n8. Testing Connection Removal & Mutual Recalculation...");
  await del(`/relationships/${reqDC.data.id}`, users.diana.token);
  console.log("   ✓ Diana removed connection with Charlie");

  const updatedMutualRes = await get(`/relationships/mutual/${users.diana.id}`, users.alice.token);
  if (updatedMutualRes.ok && updatedMutualRes.data.count === 1 && updatedMutualRes.data.mutualConnections[0].displayName === "Bob Smith") {
    console.log("   ✓ Mutual connections accurately updated to 1 (only Bob Smith)");
  } else {
    console.error("   ✗ Expected 1 mutual connection (Bob Smith), got:", updatedMutualRes);
    process.exit(1);
  }

  // 10. Recommendations Test
  console.log("\n9. Testing AI Recommendations Engine...");
  const recRes = await get("/recommendations?limit=5", users.alice.token);
  if (recRes.ok && Array.isArray(recRes.data) && recRes.data.length > 0) {
    console.log(`   ✓ Received ${recRes.data.length} recommendations for Alice`);
    recRes.data.forEach(r => {
      console.log(`     - ${r.displayName} (${r.headline}): Score ${r.score}% | Reasons: ${r.reasons.join("; ")}`);
    });
  } else {
    console.error("   ✗ Failed recommendations check:", recRes);
    process.exit(1);
  }

  // 11. Discovery & Search Test
  console.log("\n10. Testing Discovery Profiles API...");
  const discRes = await get("/discovery/profiles?keyword=Director", users.alice.token);
  if (discRes.ok && discRes.data.content && discRes.data.content.length > 0) {
    console.log(`   ✓ Found ${discRes.data.content.length} profile matching keyword 'Director': ${discRes.data.content[0].displayName}`);
  } else {
    console.error("   ✗ Failed discovery search check:", discRes);
    process.exit(1);
  }

  console.log("\n=======================================================");
  console.log("ALL 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY (100%)!");
  console.log("=======================================================\n");
}

run().catch(err => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
