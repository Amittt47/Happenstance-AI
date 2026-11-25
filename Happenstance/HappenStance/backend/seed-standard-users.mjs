// Seeder script for standard demonstration accounts in MongoDB

const BASE_URL = "http://localhost:8080/api/v1";

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function put(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function patch(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json().catch(() => ({}));
}

async function run() {
  const demoUsers = [
    {
      displayName: "Alice Johnson",
      email: "alice@happenstance.com",
      password: "SecurePassword123!",
      headline: "Senior Full-Stack Engineer",
      bio: "Passionate about modern web platforms, TypeScript, and distributed systems. Always exploring clean architecture and microservices.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["React", "TypeScript", "Java", "Spring Boot", "Next.js"],
      interests: ["Open Source", "Distributed Systems", "AI Tools"],
      visibility: "PUBLIC"
    },
    {
      displayName: "Bob Smith",
      email: "bob@happenstance.com",
      password: "SecurePassword123!",
      headline: "Staff Cloud Infrastructure Architect",
      bio: "Specializing in Kubernetes orchestration, high availability, and multi-region MongoDB clustering.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["Kubernetes", "Docker", "Java", "MongoDB", "DevOps"],
      interests: ["Cloud Infrastructure", "System Resilience"],
      visibility: "PUBLIC"
    },
    {
      displayName: "Charlie Davis",
      email: "charlie@happenstance.com",
      password: "SecurePassword123!",
      headline: "Principal Product Designer",
      bio: "Designing accessible and intuitive digital experiences. Design systems enthusiast.",
      location: "New York, NY",
      industry: "Product Design",
      skills: ["UI/UX", "Figma", "Design Systems", "User Research", "React"],
      interests: ["Design Systems", "Accessibility", "Typography"],
      visibility: "PUBLIC"
    },
    {
      displayName: "Diana Prince",
      email: "diana@happenstance.com",
      password: "SecurePassword123!",
      headline: "VP of Engineering",
      bio: "Engineering leader focused on high-throughput backend platforms and career development.",
      location: "San Francisco, CA",
      industry: "Software Engineering",
      skills: ["Engineering Management", "Spring Boot", "Cloud Architecture", "Leadership"],
      interests: ["Mentorship", "Engineering Strategy"],
      visibility: "PUBLIC"
    },
    {
      displayName: "Evan Wright",
      email: "evan@happenstance.com",
      password: "SecurePassword123!",
      headline: "Senior AI & Data Scientist",
      bio: "Researching graph neural networks and large-scale recommendation intelligence algorithms.",
      location: "Austin, TX",
      industry: "Data Science",
      skills: ["Python", "PyTorch", "Graph Neural Networks", "Machine Learning"],
      interests: ["Graph Theory", "AI Research"],
      visibility: "PUBLIC"
    }
  ];

  console.log("Seeding standard demo accounts...");
  const registered = [];

  for (const u of demoUsers) {
    let auth = await post("/auth/register", {
      displayName: u.displayName,
      email: u.email,
      password: u.password
    });

    if (!auth.accessToken) {
      // If already registered, login
      auth = await post("/auth/login", {
        email: u.email,
        password: u.password
      });
    }

    if (auth.accessToken) {
      registered.push({ ...u, token: auth.accessToken, userId: auth.user.id });
      // Update profile
      await put("/profiles/me", {
        headline: u.headline,
        bio: u.bio,
        location: u.location,
        industry: u.industry,
        skills: u.skills,
        interests: u.interests,
        visibility: u.visibility
      }, auth.accessToken);
      console.log(`✓ Seeded & updated: ${u.displayName} (${u.email})`);
    } else {
      console.error(`✗ Failed for ${u.email}:`, auth);
    }
  }

  // Connect Alice <-> Bob
  const alice = registered.find(u => u.email === "alice@happenstance.com");
  const bob = registered.find(u => u.email === "bob@happenstance.com");
  const charlie = registered.find(u => u.email === "charlie@happenstance.com");
  const diana = registered.find(u => u.email === "diana@happenstance.com");

  if (alice && bob && charlie && diana) {
    // Alice -> Bob
    const rAB = await post(`/relationships/${bob.userId}`, {}, alice.token);
    if (rAB.id) await patch(`/relationships/${rAB.id}/accept`, {}, bob.token);

    // Alice -> Charlie
    const rAC = await post(`/relationships/${charlie.userId}`, {}, alice.token);
    if (rAC.id) await patch(`/relationships/${rAC.id}/accept`, {}, charlie.token);

    // Diana -> Bob
    const rDB = await post(`/relationships/${bob.userId}`, {}, diana.token);
    if (rDB.id) await patch(`/relationships/${rDB.id}/accept`, {}, bob.token);

    // Diana -> Charlie
    const rDC = await post(`/relationships/${charlie.userId}`, {}, diana.token);
    if (rDC.id) await patch(`/relationships/${rDC.id}/accept`, {}, charlie.token);

    console.log("✓ Established mutual network: Alice & Diana both connected to Bob & Charlie!");
  }
}

run().catch(console.error);
