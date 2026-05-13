# Hardware, Edge, and Physical-World Memory

## Purpose

StackMemory can evolve beyond software-only LLM agents.

The same shared memory layer can support physical-world systems: robots, sensors, edge devices, smart assistants, kiosks, vehicles, field-service operations, retail devices, warehouses, and local automation boxes.

The long-term idea:

> Every physical agent should have memory too.

A robot, local automation device, mobile worker app, or embedded assistant should remember user preferences, environment facts, past failures, maintenance events, location rules, and safe operating constraints.

---

## Product Direction

StackMemory should support two classes of agents:

1. **Cloud agents**
   - LLM workflows
   - MCP clients
   - coding agents
   - n8n automations
   - SaaS copilots

2. **Physical/edge agents**
   - Raspberry Pi / mini PC workers
   - local kiosks
   - mobile field-worker devices
   - service operation devices
   - cameras and inspection systems
   - warehouse scanners
   - IoT sensors
   - robotic agents
   - vehicle/route assistants

---

## Why Physical Memory Matters

Software agents need context.

Physical agents need context plus continuity.

Examples:

- A field-service assistant remembers customer preferences, material sensitivity, previous issues, photos, service history, and quote notes.
- A robot remembers which rooms or zones are risky, blocked, sensitive, or previously problematic.
- A kiosk remembers location-specific behavior, common questions, operating hours, and maintenance issues.
- A warehouse scanner remembers product exceptions, shelf rules, recurring mistakes, and worker instructions.
- A vehicle/route assistant remembers delivery constraints, parking notes, customer notes, and failed routes.
- A local automation box remembers API failures, device outages, sensor drift, and recovery steps.

---

## Edge Memory Model

Physical systems should not depend on constant internet access.

A production design should support:

- cloud-first memory
- local cache
- offline queue
- delayed sync
- conflict resolution
- device identity
- device-level API keys
- location/zone namespaces
- strict safety policies

```text
Physical device
   ↓
Local edge memory cache
   ↓
Offline event queue
   ↓
StackMemory sync gateway
   ↓
Cloud memory + graph + brain layer
   ↓
Context pack returned to device/agent
```

---

## Device Identity

Each physical device should have its own identity and scoped credentials.

Suggested identity shape:

```json
{
  "device_id": "dev_abc123",
  "owner_id": "user_123",
  "organization_id": "org_123",
  "namespace": "site:field-ops/device:van-1",
  "device_type": "mobile_field_assistant",
  "scopes": ["memory:read", "memory:write", "events:write"],
  "status": "active"
}
```

---

## Physical Memory Types

Additional memory types for physical-world use:

- `location_fact` — stable information about a location/site
- `device_event` — device state change or operational event
- `maintenance_note` — repair, failure, calibration, or service record
- `safety_rule` — hard safety constraint for physical action
- `environment_constraint` — physical limitation such as access, lighting, noise, floor, fabric, weather, layout
- `customer_site_preference` — customer/location-specific preference
- `inspection_observation` — visual or sensor-based observation
- `route_note` — route, parking, access, timing, or delivery detail
- `sensor_pattern` — repeated sensor signal or anomaly pattern
- `operator_instruction` — instruction from a human operator

---

## Namespaces for Physical Systems

Suggested namespace hierarchy:

```text
global
user:<id>
org:<id>
project:<id>
site:<id>
device:<id>
vehicle:<id>
customer:<id>
job:<id>
zone:<id>
```

Examples:

```text
org:service-company/site:customer-482/job:2026-05-13
org:warehouse-a/zone:cold-storage/device:scanner-2
user:lee/device:home-edge-box/project:agent-lab
```

---

## Edge Context Compiler

A physical device should not receive a generic memory dump.

It should receive a safe, short, action-specific context pack.

Example output:

```json
{
  "device_context": {
    "site_rules": [],
    "safety_rules": [],
    "customer_preferences": [],
    "environment_constraints": [],
    "known_failures": [],
    "maintenance_notes": [],
    "active_job_notes": []
  },
  "allowed_actions": [],
  "blocked_actions": [],
  "confidence": 0.87,
  "memory_ids": []
}
```

---

## Hardware Integration Surfaces

StackMemory should eventually expose:

### 1. Edge REST API

Simple HTTP interface for devices and local workers.

### 2. MQTT Gateway

Useful for sensor-heavy environments and IoT device fleets.

### 3. WebSocket Stream

Useful for real-time device sessions and field-assistant apps.

### 4. Local SDK

Small SDK for Python/Node running on:

- Raspberry Pi
- mini PC
- industrial PC
- Android field device
- Windows automation box
- Linux VPS/edge server

### 5. Local-first cache

SQLite local cache for offline use.

---

## Physical Safety Rules

Physical-world memory requires stricter safety controls than software memory.

Required controls:

- no dangerous physical action without human approval
- no autonomous bypass of locks, alarms, safety systems, or restricted areas
- confidence thresholds for action suggestions
- audit logs for physical recommendations
- device-specific permissions
- operator override
- emergency stop / disable device key
- sensor data retention policy
- customer privacy controls for images/video/audio

---

## Hardware MVP Options

### MVP A — Edge Memory Box

A small local agent box that runs on a mini PC or Raspberry Pi.

Responsibilities:

- sync selected memory locally
- accept local events
- call cloud StackMemory when online
- provide context to local automations
- queue writes while offline

### MVP B — Field Service Memory Assistant

A mobile/edge assistant for service businesses.

Example use cases:

- customer/job memory
- before/after photo notes
- quote history
- material warnings
- employee instructions
- recurring customer preferences
- route/access notes

### MVP C — Automation Control Memory

A local memory layer for n8n/Home Assistant/Node-RED style automations.

Use cases:

- remember failed automations
- remember recovery steps
- store device-specific quirks
- compile local context before an LLM automation acts

### MVP D — Robot/Inspection Memory

A memory backend for robots, camera inspections, and sensor agents.

Use cases:

- zone maps
- repeated anomalies
- route failures
- blocked areas
- safety constraints
- maintenance observations

---

## Recommended First Hardware Path

Start with **Edge Memory Box**, not robotics.

Reason:

- cheaper
- safer
- easier to demo
- works with existing StackMemory MCP/API architecture
- can run on VPS, local mini PC, WSL2, or Raspberry Pi
- useful for both software and physical workflows

Initial stack:

```text
Device: mini PC / Raspberry Pi / local Linux box
Runtime: Docker
Local DB: SQLite
Queue: lightweight file/SQLite queue
Sync: StackMemory Cloud API/MCP gateway
Agent: Python or Node worker
Optional: MQTT bridge later
```

---

## Relationship to Personal Mini Model

Physical-world memory makes the personal brain stronger.

A personal mini model should eventually understand not just digital preferences, but also:

- places
- devices
- routines
- service history
- physical constraints
- repeated failures
- safety rules
- environment-specific preferences

This turns StackMemory from an AI tool memory into a real-world operating memory layer.

---

## Roadmap Add-on

### Phase H1 — Device identities

- device API keys
- device scopes
- device namespaces
- revoke/rotate keys

### Phase H2 — Edge cache

- local SQLite cache
- offline queue
- sync protocol
- conflict handling

### Phase H3 — Edge context packs

- `sm_prefetch` with `device_type`
- physical safety rules
- location/job/customer namespaces

### Phase H4 — MQTT/WebSocket gateway

- device events
- sensor events
- heartbeat
- remote config

### Phase H5 — Physical memory dashboard

- devices
- sites
- jobs
- maintenance
- event logs
- safety rules

---

## Non-goals for Now

- Do not start with autonomous robotics.
- Do not make dangerous physical-control claims.
- Do not process camera/audio data without explicit privacy controls.
- Do not require a GPU device for MVP.
- Do not train a personal model on physical-world data without explicit approval.
