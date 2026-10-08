/**
 * CampusOS development seed.
 *
 * Run with `npm run prisma:seed` (wraps `prisma db seed`) or directly with
 * `npx tsx prisma/seed.ts` from `backend/`.
 *
 * - Contains development/demo data only — never real people or credentials.
 * - Idempotent: every record is upserted, so the script can be re-run safely.
 *   Rows without a natural unique key (courses, events, resources, posts,
 *   notices) use stable seed UUIDs so re-runs update instead of duplicating.
 * - Every demo account shares the password below. It is a throwaway value for
 *   local development; the authentication step must verify hashes produced by
 *   `hashPassword`, not this constant.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  EventRegistrationStatus,
  NoticePriority,
  PrismaClient,
  ResourceType,
  UserRole,
} from "../src/generated/prisma/client.js";

// Prisma 7 does not load .env files automatically.
try {
  process.loadEnvFile();
} catch {
  // No .env file present — rely on the process environment.
}

const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL (or DIRECT_URL) must be set before running the seed.",
  );
}

// Prisma 7 requires a driver adapter at runtime.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// ---------------------------------------------------------------------------
// Demo credentials and password hashing
// ---------------------------------------------------------------------------

/** Shared password for every seeded account. Development use only. */
const DEMO_PASSWORD = "CampusOS#2026";

/**
 * Hash format the authentication step must be able to verify:
 *   scrypt$<N>$<r>$<p>$<salt-hex>$<derived-key-hex>
 */
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 } as const;

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    ...SCRYPT_PARAMS,
  });

  return [
    "scrypt",
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

// ---------------------------------------------------------------------------
// Date helpers — events stay "upcoming" whenever the seed is executed
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;
const seededAt = new Date();

function daysFromNow(days: number, hour = 10): Date {
  const date = new Date(seededAt.getTime() + days * DAY_MS);
  date.setHours(hour, 0, 0, 0);
  return date;
}

// ---------------------------------------------------------------------------
// Stable identifiers for models without a natural unique key
// ---------------------------------------------------------------------------

const ids = {
  courses: {
    cse1101: "ca000001-0000-4000-8000-000000000001",
    cse2115: "ca000002-0000-4000-8000-000000000002",
    cse3101: "ca000003-0000-4000-8000-000000000003",
    cse3201: "ca000004-0000-4000-8000-000000000004",
    eee1101: "ca000005-0000-4000-8000-000000000005",
    eee2201: "ca000006-0000-4000-8000-000000000006",
  },
  events: {
    programmingContest: "ea000001-0000-4000-8000-000000000001",
    campusHackathon: "ea000002-0000-4000-8000-000000000002",
    gitWorkshop: "ea000003-0000-4000-8000-000000000003",
    cpSeminar: "ea000004-0000-4000-8000-000000000004",
    culturalNight: "ea000005-0000-4000-8000-000000000005",
    debateChampionship: "ea000006-0000-4000-8000-000000000006",
  },
  resources: {
    linkedLists: "ee000001-0000-4000-8000-000000000001",
    dsMidterm: "ee000002-0000-4000-8000-000000000002",
    sqlLab: "ee000003-0000-4000-8000-000000000003",
    normalization: "ee000004-0000-4000-8000-000000000004",
    networkFinal: "ee000005-0000-4000-8000-000000000005",
    numberSystems: "ee000006-0000-4000-8000-000000000006",
    dsMakeupClass: "ee000007-0000-4000-8000-000000000007",
    kirchhoff: "ee000008-0000-4000-8000-000000000008",
    logicGates: "ee000009-0000-4000-8000-000000000009",
    referenceBooks: "ee000010-0000-4000-8000-00000000000a",
  },
  posts: {
    contestRegistration: "b0000001-0000-4000-8000-000000000001",
    labEquipment: "b0000002-0000-4000-8000-000000000002",
    culturalAuditions: "b0000003-0000-4000-8000-000000000003",
    workshopFeedback: "b0000004-0000-4000-8000-000000000004",
  },
  notices: {
    campusClosed: "d0000001-0000-4000-8000-000000000001",
    examRoutine: "d0000002-0000-4000-8000-000000000002",
    libraryHours: "d0000003-0000-4000-8000-000000000003",
    feeDeadline: "d0000004-0000-4000-8000-000000000004",
  },
} as const;

/** Placeholder file locations — Supabase Storage is wired up later. */
const fileUrl = (path: string) => `https://example.invalid/campusos/${path}`;

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedDepartments() {
  const departments = [
    {
      code: "CSE",
      name: "Computer Science & Engineering",
      description: "Software, systems and computing research.",
    },
    {
      code: "EEE",
      name: "Electrical & Electronic Engineering",
      description: "Electrical, electronics and power systems.",
    },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: department,
      create: department,
    });
  }

  const cse = await prisma.department.findUniqueOrThrow({
    where: { code: "CSE" },
  });
  const eee = await prisma.department.findUniqueOrThrow({
    where: { code: "EEE" },
  });

  return { cse, eee };
}

async function seedUsers(departmentIds: { cse: string; eee: string }): Promise<{
  admin: { id: string };
  clubAdmin: { id: string };
  resourceAdmin: { id: string };
  studentOne: { id: string };
  studentTwo: { id: string };
}> {
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const accounts = [
    {
      key: "admin",
      name: "Ayesha Rahman",
      email: "admin@campusos.dev",
      role: UserRole.ADMIN,
      studentId: null,
      batch: null,
      section: null,
      departmentId: null,
    },
    {
      key: "clubAdmin",
      name: "Tanvir Ahmed",
      email: "club.admin@campusos.dev",
      role: UserRole.CLUB_ADMIN,
      studentId: "CSE-2021-014",
      batch: "67",
      section: "A",
      departmentId: departmentIds.cse,
    },
    {
      key: "resourceAdmin",
      name: "Nusrat Jahan",
      email: "resource.admin@campusos.dev",
      role: UserRole.RESOURCE_ADMIN,
      studentId: null,
      batch: null,
      section: null,
      departmentId: departmentIds.cse,
    },
    {
      key: "studentOne",
      name: "Rafid Hasan",
      email: "student1@campusos.dev",
      role: UserRole.STUDENT,
      studentId: "CSE-2023-142",
      batch: "67",
      section: "A",
      departmentId: departmentIds.cse,
    },
    {
      key: "studentTwo",
      name: "Sadia Islam",
      email: "student2@campusos.dev",
      role: UserRole.STUDENT,
      studentId: "EEE-2023-057",
      batch: "67",
      section: "A",
      departmentId: departmentIds.eee,
    },
  ];

  const users: Record<string, { id: string }> = {};

  for (const { key, ...account } of accounts) {
    const data = { ...account, passwordHash };
    users[key] = await prisma.user.upsert({
      where: { email: account.email },
      update: data,
      create: data,
      select: { id: true },
    });
  }

  return users as {
    admin: { id: string };
    clubAdmin: { id: string };
    resourceAdmin: { id: string };
    studentOne: { id: string };
    studentTwo: { id: string };
  };
}

async function seedClubs() {
  const clubs = [
    {
      slug: "computer-club",
      name: "Computer Club",
      description:
        "Programming contests, workshops and tech talks for the campus developer community.",
      contactEmail: "computer.club@campusos.dev",
      logoUrl: fileUrl("clubs/computer-club/logo.png"),
      coverImageUrl: fileUrl("clubs/computer-club/cover.jpg"),
    },
    {
      slug: "cultural-society",
      name: "Cultural Society",
      description:
        "Music, drama and seasonal celebrations hosted by the students of the campus.",
      contactEmail: "cultural.society@campusos.dev",
      logoUrl: fileUrl("clubs/cultural-society/logo.png"),
      coverImageUrl: fileUrl("clubs/cultural-society/cover.jpg"),
    },
  ];

  const seeded: Record<string, { id: string }> = {};

  for (const club of clubs) {
    seeded[club.slug] = await prisma.club.upsert({
      where: { slug: club.slug },
      update: club,
      create: club,
      select: { id: true },
    });
  }

  return {
    computerClub: seeded["computer-club"],
    culturalSociety: seeded["cultural-society"],
  };
}

async function seedClubAdmins(
  clubAdminId: string,
  assignedById: string,
  clubIds: string[],
) {
  for (const clubId of clubIds) {
    await prisma.clubAdminAssignment.upsert({
      where: { userId_clubId: { userId: clubAdminId, clubId } },
      update: { assignedBy: assignedById },
      create: { userId: clubAdminId, clubId, assignedBy: assignedById },
    });
  }
}

async function seedCourses(departmentIds: { cse: string; eee: string }) {
  const courses = [
    {
      id: ids.courses.cse1101,
      departmentId: departmentIds.cse,
      code: "CSE 1101",
      name: "Structured Programming",
      description: "Problem solving with a procedural programming language.",
    },
    {
      id: ids.courses.cse2115,
      departmentId: departmentIds.cse,
      code: "CSE 2115",
      name: "Data Structures and Algorithms",
      description: "Lists, trees, graphs, sorting and complexity analysis.",
    },
    {
      id: ids.courses.cse3101,
      departmentId: departmentIds.cse,
      code: "CSE 3101",
      name: "Database Management Systems",
      description: "Relational modelling, SQL and transaction management.",
    },
    {
      id: ids.courses.cse3201,
      departmentId: departmentIds.cse,
      code: "CSE 3201",
      name: "Computer Networks",
      description: "Layered protocols, routing and network applications.",
    },
    {
      id: ids.courses.eee1101,
      departmentId: departmentIds.eee,
      code: "EEE 1101",
      name: "Electrical Circuits I",
      description: "DC circuit analysis and network theorems.",
    },
    {
      id: ids.courses.eee2201,
      departmentId: departmentIds.eee,
      code: "EEE 2201",
      name: "Digital Electronics",
      description: "Logic gates, combinational and sequential circuits.",
    },
  ];

  for (const { id, ...data } of courses) {
    await prisma.course.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

async function seedEvents(params: {
  computerClub: string;
  culturalSociety: string;
  createdBy: string;
}) {
  const clubIds = {
    computerClub: params.computerClub,
    culturalSociety: params.culturalSociety,
  };
  const events = [
    {
      id: ids.events.programmingContest,
      clubId: clubIds.computerClub,
      title: "Intra-University Programming Contest 2026",
      slug: "intra-university-programming-contest-2026",
      description:
        "A five-hour team contest with problems spanning data structures, algorithms and number theory.",
      eventType: "Competition",
      location: "Software Lab, Academic Building 3",
      startTime: daysFromNow(21),
      endTime: daysFromNow(21, 16),
      registrationStart: daysFromNow(-5),
      registrationEnd: daysFromNow(18),
      maxAttendees: 120,
      isRegistrationRequired: true,
      coverImageUrl: fileUrl("events/programming-contest-2026/cover.jpg"),
    },
    {
      id: ids.events.campusHackathon,
      clubId: clubIds.computerClub,
      title: "Campus Hackathon 2026",
      slug: "campus-hackathon-2026",
      description:
        "A 36-hour build sprint for student teams working on campus-focused software.",
      eventType: "Hackathon",
      location: "Central Auditorium",
      startTime: daysFromNow(45),
      endTime: daysFromNow(47, 18),
      registrationStart: daysFromNow(-2),
      registrationEnd: daysFromNow(40),
      maxAttendees: 80,
      isRegistrationRequired: true,
      coverImageUrl: null,
    },
    {
      id: ids.events.gitWorkshop,
      clubId: clubIds.computerClub,
      title: "Git and GitHub Workshop",
      slug: "git-and-github-workshop",
      description:
        "Hands-on session covering branching, pull requests and collaborative workflows.",
      eventType: "Workshop",
      location: "Room 302, Academic Building 2",
      startTime: daysFromNow(7, 15),
      endTime: daysFromNow(7, 17),
      registrationStart: daysFromNow(-10),
      registrationEnd: daysFromNow(5),
      maxAttendees: 60,
      isRegistrationRequired: true,
      coverImageUrl: null,
    },
    {
      id: ids.events.cpSeminar,
      clubId: clubIds.computerClub,
      title: "Introduction to Competitive Programming",
      slug: "introduction-to-competitive-programming",
      description:
        "Open seminar on contest strategy, practice routines and useful resources.",
      eventType: "Seminar",
      location: "Seminar Room 1",
      startTime: daysFromNow(-30, 14),
      endTime: daysFromNow(-30, 16),
      registrationStart: null,
      registrationEnd: null,
      maxAttendees: null,
      isRegistrationRequired: false,
      coverImageUrl: null,
    },
    {
      id: ids.events.culturalNight,
      clubId: clubIds.culturalSociety,
      title: "Spring Cultural Night",
      slug: "spring-cultural-night",
      description:
        "An evening of music, dance and drama performed by campus clubs and student bands.",
      eventType: "Cultural",
      location: "Open Air Theatre",
      startTime: daysFromNow(14, 18),
      endTime: daysFromNow(14, 22),
      registrationStart: daysFromNow(-7),
      registrationEnd: daysFromNow(12),
      maxAttendees: 300,
      isRegistrationRequired: true,
      coverImageUrl: fileUrl("events/spring-cultural-night/cover.jpg"),
    },
    {
      id: ids.events.debateChampionship,
      clubId: clubIds.culturalSociety,
      title: "Inter-Department Debate Championship 2025",
      slug: "inter-department-debate-championship-2025",
      description:
        "Knockout debate tournament between departments, held in the previous semester.",
      eventType: "Competition",
      location: "Central Auditorium",
      startTime: daysFromNow(-60, 9),
      endTime: daysFromNow(-60, 17),
      registrationStart: daysFromNow(-75),
      registrationEnd: daysFromNow(-65),
      maxAttendees: 64,
      isRegistrationRequired: true,
      coverImageUrl: null,
    },
  ];

  for (const { id, ...data } of events) {
    const event = { ...data, createdBy: params.createdBy };

    await prisma.event.upsert({
      where: { id },
      update: event,
      create: { id, ...event },
    });
  }
}

async function seedResources(params: {
  resourceAdminId: string;
  adminId: string;
}) {
  const resources = [
    {
      id: ids.resources.linkedLists,
      courseId: ids.courses.cse2115,
      title: "Linked Lists — Lecture Slides",
      description:
        "Singly, doubly and circular linked lists with complexity notes.",
      resourceType: ResourceType.NOTE,
      fileName: "cse-2115-linked-lists.pdf",
      fileSize: 1_486_848,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.dsMidterm,
      courseId: ids.courses.cse2115,
      title: "Midterm Question Paper — Fall 2025",
      description: "Previous midterm paper with marking distribution.",
      resourceType: ResourceType.QUESTION_PAPER,
      fileName: "cse-2115-midterm-fall-2025.pdf",
      fileSize: 722_944,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.sqlLab,
      courseId: ids.courses.cse3101,
      title: "Lab 02 — SQL Joins and Subqueries",
      description: "Lab manual for the second database lab session.",
      resourceType: ResourceType.LAB_MANUAL,
      fileName: "cse-3101-lab-02-sql-joins.pdf",
      fileSize: 981_760,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.normalization,
      courseId: ids.courses.cse3101,
      title: "Normalization Cheat Sheet",
      description: "1NF through BCNF with worked decomposition examples.",
      resourceType: ResourceType.NOTE,
      fileName: "cse-3101-normalization-cheatsheet.pdf",
      fileSize: 356_352,
      mimeType: "application/pdf",
      batch: "67",
      section: null,
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.networkFinal,
      courseId: ids.courses.cse3201,
      title: "Final Question Paper — Spring 2025",
      description: "Previous final examination paper for Computer Networks.",
      resourceType: ResourceType.QUESTION_PAPER,
      fileName: "cse-3201-final-spring-2025.pdf",
      fileSize: 1_048_576,
      mimeType: "application/pdf",
      batch: "66",
      section: "B",
      uploadedBy: params.adminId,
      isPublished: true,
    },
    {
      id: ids.resources.numberSystems,
      courseId: ids.courses.cse1101,
      title: "Number Systems and Boolean Algebra",
      description: "Introductory notes for the first weeks of the course.",
      resourceType: ResourceType.NOTE,
      fileName: "cse-1101-number-systems.pdf",
      fileSize: 634_880,
      mimeType: "application/pdf",
      batch: "68",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.dsMakeupClass,
      courseId: ids.courses.cse2115,
      title: "Makeup Class Notice — Week 9",
      description: "Rescheduled class for the Data Structures section A.",
      resourceType: ResourceType.NOTICE,
      fileName: "cse-2115-makeup-class-notice.pdf",
      fileSize: 145_408,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.kirchhoff,
      courseId: ids.courses.eee1101,
      title: "Kirchhoff's Laws — Worked Examples",
      description: "Solved problems applying KVL and KCL to DC networks.",
      resourceType: ResourceType.NOTE,
      fileName: "eee-1101-kirchhoff-worked-examples.pdf",
      fileSize: 845_824,
      mimeType: "application/pdf",
      batch: "67",
      section: "A",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.logicGates,
      courseId: ids.courses.eee2201,
      title: "Lab 01 — Logic Gates",
      description: "Verification of basic and universal logic gates.",
      resourceType: ResourceType.LAB_MANUAL,
      fileName: "eee-2201-lab-01-logic-gates.pdf",
      fileSize: 1_152_102,
      mimeType: "application/pdf",
      batch: "67",
      section: "B",
      uploadedBy: params.resourceAdminId,
      isPublished: true,
    },
    {
      id: ids.resources.referenceBooks,
      courseId: ids.courses.eee2201,
      title: "Reference Book List",
      description:
        "Optional reading list for Digital Electronics. Awaiting review.",
      resourceType: ResourceType.OTHER,
      fileName: "eee-2201-reference-books.docx",
      fileSize: 58_368,
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      batch: "67",
      section: "B",
      uploadedBy: params.resourceAdminId,
      isPublished: false,
    },
  ];

  for (const { id, ...data } of resources) {
    const resource = {
      ...data,
      fileUrl: fileUrl(`resources/${data.fileName}`),
    };

    await prisma.resource.upsert({
      where: { id },
      update: resource,
      create: { id, ...resource },
    });
  }
}

async function seedRegistrations(params: {
  events: {
    programmingContest: string;
    gitWorkshop: string;
    culturalNight: string;
    debateChampionship: string;
  };
  studentOneId: string;
  studentTwoId: string;
}) {
  const registrations = [
    {
      eventId: params.events.programmingContest,
      userId: params.studentOneId,
      registrationCode: "COS-REG-1001",
      qrToken: "9f1c4b7a2d8e4f6081a3c5d7e9b0f213",
      status: EventRegistrationStatus.REGISTERED,
      registeredAt: daysFromNow(-4, 11),
    },
    {
      eventId: params.events.programmingContest,
      userId: params.studentTwoId,
      registrationCode: "COS-REG-1002",
      qrToken: "3d7e0a5c8b2f4e9d6c1a8f3b5d0e7c24",
      status: EventRegistrationStatus.REGISTERED,
      registeredAt: daysFromNow(-3, 18),
    },
    {
      eventId: params.events.gitWorkshop,
      userId: params.studentTwoId,
      registrationCode: "COS-REG-1003",
      qrToken: "a4b8c2d6e0f1a3b5c7d9e1f3a5b7c9d1",
      status: EventRegistrationStatus.REGISTERED,
      registeredAt: daysFromNow(-8, 9),
    },
    {
      eventId: params.events.culturalNight,
      userId: params.studentOneId,
      registrationCode: "COS-REG-1004",
      qrToken: "5c8e1a4d7b0f3e6c9a2d5f8b1e4c7a03",
      status: EventRegistrationStatus.CANCELLED,
      registeredAt: daysFromNow(-6, 20),
    },
    {
      eventId: params.events.debateChampionship,
      userId: params.studentTwoId,
      registrationCode: "COS-REG-1005",
      qrToken: "e7f2b9c4a1d6e3f8b5c2a9d7e4f1b6c3",
      status: EventRegistrationStatus.ATTENDED,
      registeredAt: daysFromNow(-70, 9),
    },
  ];

  for (const registration of registrations) {
    const { eventId, userId, ...data } = registration;
    await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: data,
      create: { eventId, userId, ...data },
    });
  }
}

async function seedAttendance(params: {
  eventId: string;
  userId: string;
  clubAdminId: string;
}) {
  const registration = await prisma.eventRegistration.findUniqueOrThrow({
    where: {
      eventId_userId: { eventId: params.eventId, userId: params.userId },
    },
    select: { id: true },
  });

  const checkedInAt = daysFromNow(-60, 10);

  await prisma.eventAttendance.upsert({
    where: { registrationId: registration.id },
    update: { checkedInBy: params.clubAdminId, checkedInAt },
    create: {
      registrationId: registration.id,
      checkedInBy: params.clubAdminId,
      checkedInAt,
    },
  });
}

async function seedClubPosts(params: {
  computerClubId: string;
  culturalSocietyId: string;
  clubAdminId: string;
  adminId: string;
}) {
  const posts = [
    {
      id: ids.posts.contestRegistration,
      clubId: params.computerClubId,
      title: "Registration open: Intra-University Programming Contest 2026",
      content:
        "Team registration for the programming contest is now open. Each team may have up to three members from any department. Bring your student ID to the registration desk for verification.",
      coverImageUrl: fileUrl("posts/contest-registration/cover.jpg"),
      createdBy: params.clubAdminId,
      isPublished: true,
      publishedAt: daysFromNow(-3, 12),
    },
    {
      id: ids.posts.labEquipment,
      clubId: params.computerClubId,
      title: "New lab equipment arrived in Room 302",
      content:
        "Draft announcement about the new machines and their availability for club members.",
      coverImageUrl: null,
      createdBy: params.clubAdminId,
      isPublished: false,
      publishedAt: null,
    },
    {
      id: ids.posts.culturalAuditions,
      clubId: params.culturalSocietyId,
      title: "Spring Cultural Night — audition dates announced",
      content:
        "Auditions for music, dance and drama segments will be held next week. Solo and group performances are both welcome; register at the society desk.",
      coverImageUrl: fileUrl("posts/cultural-auditions/cover.jpg"),
      createdBy: params.clubAdminId,
      isPublished: true,
      publishedAt: daysFromNow(-10, 17),
    },
    {
      id: ids.posts.workshopFeedback,
      clubId: params.computerClubId,
      title: "Feedback form for the Git workshop",
      content:
        "Thank you to everyone who attended. Please share your feedback so we can plan the next session.",
      coverImageUrl: null,
      createdBy: params.adminId,
      isPublished: true,
      publishedAt: daysFromNow(-1, 15),
    },
  ];

  for (const { id, ...data } of posts) {
    await prisma.clubPost.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

async function seedOfficialNotices(adminId: string) {
  const notices = [
    {
      id: ids.notices.campusClosed,
      title: "Campus closed on 12 October",
      content:
        "Due to the weather warning issued for the district, all classes and office activities will remain suspended on 12 October. Hostel residents should contact their hall office for assistance.",
      attachmentUrl: null,
      priority: NoticePriority.URGENT,
      createdBy: adminId,
      isPublished: true,
      publishedAt: daysFromNow(-1, 8),
    },
    {
      id: ids.notices.examRoutine,
      title: "Midterm examination routine published",
      content:
        "The midterm examination routine for all departments is now available. Students must carry their admit card to every examination hall.",
      attachmentUrl: fileUrl("notices/midterm-routine.pdf"),
      priority: NoticePriority.IMPORTANT,
      createdBy: adminId,
      isPublished: true,
      publishedAt: daysFromNow(-7, 10),
    },
    {
      id: ids.notices.libraryHours,
      title: "Library hours extended during exam week",
      content:
        "The central library will remain open until 10:00 PM from the first day of the examination week.",
      attachmentUrl: null,
      priority: NoticePriority.NORMAL,
      createdBy: adminId,
      isPublished: true,
      publishedAt: daysFromNow(-14, 9),
    },
    {
      id: ids.notices.feeDeadline,
      title: "Semester fee payment deadline",
      content:
        "Draft notice about the semester fee deadline and the payment counters. Pending approval before publication.",
      attachmentUrl: null,
      priority: NoticePriority.IMPORTANT,
      createdBy: adminId,
      isPublished: false,
      publishedAt: null,
    },
  ];

  for (const { id, ...data } of notices) {
    await prisma.officialNotice.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });
  }
}

async function main(): Promise<void> {
  console.log("Seeding CampusOS development data...");

  const departments = await seedDepartments();
  const users = await seedUsers({
    cse: departments.cse.id,
    eee: departments.eee.id,
  });
  const clubs = await seedClubs();

  await seedClubAdmins(users.clubAdmin.id, users.admin.id, [
    clubs.computerClub.id,
    clubs.culturalSociety.id,
  ]);

  await seedCourses({ cse: departments.cse.id, eee: departments.eee.id });

  await seedEvents({
    computerClub: clubs.computerClub.id,
    culturalSociety: clubs.culturalSociety.id,
    createdBy: users.clubAdmin.id,
  });

  await seedResources({
    resourceAdminId: users.resourceAdmin.id,
    adminId: users.admin.id,
  });

  await seedRegistrations({
    events: {
      programmingContest: ids.events.programmingContest,
      gitWorkshop: ids.events.gitWorkshop,
      culturalNight: ids.events.culturalNight,
      debateChampionship: ids.events.debateChampionship,
    },
    studentOneId: users.studentOne.id,
    studentTwoId: users.studentTwo.id,
  });

  await seedAttendance({
    eventId: ids.events.debateChampionship,
    userId: users.studentTwo.id,
    clubAdminId: users.clubAdmin.id,
  });

  await seedClubPosts({
    computerClubId: clubs.computerClub.id,
    culturalSocietyId: clubs.culturalSociety.id,
    clubAdminId: users.clubAdmin.id,
    adminId: users.admin.id,
  });

  await seedOfficialNotices(users.admin.id);

  const [
    userCount,
    departmentCount,
    courseCount,
    clubCount,
    clubAdminCount,
    eventCount,
    registrationCount,
    attendanceCount,
    resourceCount,
    postCount,
    noticeCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.course.count(),
    prisma.club.count(),
    prisma.clubAdminAssignment.count(),
    prisma.event.count(),
    prisma.eventRegistration.count(),
    prisma.eventAttendance.count(),
    prisma.resource.count(),
    prisma.clubPost.count(),
    prisma.officialNotice.count(),
  ]);

  console.log(
    [
      `users: ${userCount}`,
      `departments: ${departmentCount}`,
      `courses: ${courseCount}`,
      `clubs: ${clubCount}`,
      `club admin assignments: ${clubAdminCount}`,
      `events: ${eventCount}`,
      `registrations: ${registrationCount}`,
      `attendance rows: ${attendanceCount}`,
      `resources: ${resourceCount}`,
      `club posts: ${postCount}`,
      `official notices: ${noticeCount}`,
    ].join(", "),
  );

  console.log(
    `Demo accounts use the development-only password: ${DEMO_PASSWORD}`,
  );
}

try {
  await main();
} catch (error) {
  console.error("Seeding failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
