---
captured_at: 2026-05-03T00:32:45.221Z
source: web
url: "https://mesa.dev/"
title: "The versioned filesystem for AI agents | Mesa"
---
# The versioned filesystem for AI agents | Mesa

[Original](https://mesa.dev/)

Connect your agents to the files they need, unlock parallel agent swarms, and track their changes automatically.

1.0Unlocks

## Build powerful features with just a few lines of code.

Governance

### Human-in-the-loop reviews & approvals

Pause any agent at any step. Build approval queues, change requests, and policy gates—then resume from the exact same workspace state.

Throughput

### Parallel agent swarms

Fork a workspace, run dozens of parallel agents on isolated branches, pick the best result.

Recovery

### Checkpoints & rollbacks

Snapshot the entire filesystem at every step. Roll back to any past state in a single API call.

search.md

summarize.md

deploy.sh

memory.json

review.md

context.md

Knowledge

### Shared memories & skills

Version skills, memories, and learned context in a filesystem your agent fleet can read and write.

tsxapp.tsx

xlsxforecast

pdfcontract

docxmemo

pnghero.png

csstheme

Universal

### Any file, any format

Version code, spreadsheets, images, and anything else.

2.0HOW IT WORKS

## Your compute is ephemeral. Your files shouldn’t be.

![Mesa sits between your applications and your compute, syncing with GitHub, GitLab, and Bitbucket.](https://mesa.dev/mesa-stack-diagram.svg)

3.0USE CASES

## Solve your hardest use cases with the most advanced filesystem in the world.

4.0WHY MESA

## You shouldn't have to choose between version control and a filesystem.

<50ms

p95 random read on 10GB file

vs. multiple seconds with s3

<1s

time to mount 10GB repo

vs. git clone taking minutes

Unlimited

concurrent writers

vs. file and directory locks on other durable filesystems

How Mesa compares to other version control and filesystem solutions.

Mesa

Git Hosts

Cloud Filesystems

Branching & merging

Version history

Diffs across any two states

Instant forks & clones (ms)

Concurrent writers

POSIX filesystem mount

Sub-50ms read/write API

Sparse materialization of files

Large file support

Strong-consistency durability

Fine-grained ACLs per branch / path

5.0ENTERPRISE READY

## Secure and built for enterprise workloads.

[Get in touch](https://cal.com/team/mesa/mesa-enterprise-intro)

Talk to our team about deploying Mesa in your environment.

Bring Your Own Cloud

### Deploy Mesa inside your own infrastructure.

Run Mesa in your own AWS, GCP, or Azure account. We operate the control plane; your data and audit trail never leave your perimeter.

Your cloud accountVPC

Mesa

Mesa Control Plane

Mesa

Mesa Distributed Storage

### SOC 2 Type II

Independently audited. AES-256 at rest, TLS 1.3 in transit, full access logging.

### Fine-grained Access

Permissions scoped to org, team, repo, branch, or path. Per-agent API keys with TTLs.

6.0PRICING

## Simple, usage-based pricing.

Two metered dimensions, a generous free tier, and no minimums. [Estimate your bill with the pricing calculator](https://mesa.dev/pricing)

### Free

Start building in minutes

$0/mo

-   50 GB storage
-   1,000 repositories
-   200 GB / mo egress
-   Unlimited virtual filesystem reads

### Scale

Scale beyond the free tier

Pay as you go

-   $0.18 / GB / mo storage
-   $0.11 / GB egress (Git + REST API)
-   Free tier included on every account
-   Priority support

### Enterprise

For teams running Mesa at scale

Custom

-   Volume & committed-use discounts
-   Self-hosted (BYOC) deployments
-   SOC 2 Type II & dedicated support
-   Custom SLAs and procurement

[Get in touch](https://cal.com/team/mesa/mesa-enterprise-intro)

7.0FAQ

## Frequently asked questions

Does my agent really need versioning?

Branch-based versioning is a huge unlock for agent applications. If you want an agent to do work that is then reviewed for approval by humans, or if you want to run parallel agent swarms that modify the same files, or if you want have an audit trail for your agents, or support checkpoints to rollback mistakes then you probably want versioning.

Why can't I just use GitHub or GitLab?

You can! You'll find that you run into rate limits, repo limits, and ergonomics that make you want to tear your hair out, though. Git providers give you branching, history, and diffs but no real filesystem — you can't mount them, random-access large files, or get sub-50ms reads. Mesa gives you all of Git's versioning semantics plus a fast, mountable filesystem in one platform.

How is this different from S3 and S3 Files?

If you just need a durable filesystem and you're on AWS then S3 Files is a great solution. S3 Files only works on AWS services, however, so if you anticipate your agent running in multiple environments you'll need a cross-cloud solution. Similarly, S3 Files doesn't support branch-basedversioning or diffs which means if you want agent swarms to edit documents in parallel you'll need to implement some level of locking or just let the agents clobber over each other. Mesa gives you built-in primitives to scale to as many agents as you need without worrying about locking.

Is MesaFS POSIX compatible?

Yes. MesaFS is 100% POSIX compatible so agents and sandboxes can use familiar Unix tools and standard filesystem APIs. Mesa handles persistence, sync, and version history transparently underneath.

My data lives in X, can I sync it to Mesa?

Mesa has built-in support for syncing data between Git upstreams like GitHub, GitLab, and others. We aim to support non-Git upstreams like S3, Google Drive, and others in the future but for now it's easy to write your own sync scripts using our APIs and MesaFS.

How does egress metering work?

You can read data from Mesa in 3 ways: Git, our REST API's content endpoint, and our virtual filesystem (MesaFS) which can be mounted in your application or on the OS itself. We meter per GB of egress for Git and our Content API but all reads through MesaFS are free and do not count towards your egress limit. MesaFS is the primary way to interact with repositories in Mesa.

Does Mesa handle large files like datasets, models, and media?

Yes. Mesa supports large files with random access, no per-file size limits, and built-in deduplication. Store code, datasets, models, and media in the same workspace.

How fast is Mesa?

Sub-50ms reads and writes through MesaFS, p95 reads under 100ms through our API, and millisecond-level forks and branches. Spinning up an isolated workspace for a parallel agent run is essentially free.

Okay but is Mesa fast enough?

When building agent applications, performance generally comes down to time-to-first-token (TTFT) and read/write latency. Mesa's TTFT is lower than Git by an order of magnitude because you avoid the cost of cloning an entire repo. Mesa materializes files on demandso your agent can start working immediately. Mesa also maintains a local cache and intelligently prefetches data based on access patterns. For warm reads, Mesa's p95 latency is on the order of nanoseconds and for cold reads it's under 100ms.

## Give your agents the files they need.

Join the waitlist for early access to Mesa.

## My note

File systems as permanent memory for agents
