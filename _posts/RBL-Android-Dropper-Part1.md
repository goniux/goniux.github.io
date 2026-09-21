---
layout: post
title: "Inside an Android Dropper: From Fake Update to Reconstructed Payload"
date: 2026-09-21
category: "Mobile Security"
tags: [android, malware-analysis, reverse-engineering, frida, jadx, dynamic-analysis, static-analysis, apk]
description: "A practical investigation into an Android dropper that reconstructs a second-stage APK at runtime, stages it briefly on disk, and installs it through Android's PackageInstaller."
---

# Inside an Android Dropper

> **The APK I started with was not the APK I wanted to analyze.**

A practical investigation into runtime unpacking, transient APK artifacts, Frida instrumentation, and reconstructing a second-stage Android payload.

---

## 00 — The Case

| Field | Value |
|---|---|
| **Sample** | `RBL CREDIT CARD ,.apk` |
| **Package** | `ognmpy.klcumpi` |
| **SHA-256** | `b6d3d866d598c91a49b6ab9a8bde75db9cee679d890ddef3a8827d938a6135fd` |
| **MD5** | `635a75e3bef45740e20deda24fe7eca1` |
| **Size** | ~1424 KB |
| **Test device** | Redmi Note 12 5G |
| **Environment** | Rooted LineageOS test device |
| **Tools** | ADB, Frida, JADX, PCAPdroid, HTTP Toolkit, Python |

The first step was intentionally simple:

**Run the APK and observe what it does.**

I didn't start with JADX.

I didn't start with Frida.

I wanted to understand the application's behaviour before diving into the implementation.

<!-- IMAGE SLOT
Save the installation screenshot as:
assets/images/rbl/01-install.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/01-install.png' | relative_url }}" alt="Installing the RBL CREDIT CARD APK with ADB">
  <figcaption>Installing the sample APK onto the rooted LineageOS research device.</figcaption>
</figure>

---

# 01 — First Contact

The application opened into an **update/store-style interface**.

It showed application information, update details, ratings, and an `UPDATE` action.

At first glance, it looked considerably more ordinary than the package name suggested.

Then Android presented another request:

**The application wanted to establish a VPN connection.**

<!-- IMAGE SLOT
Save the opening-screen + VPN permission screenshot as:
assets/images/rbl/02-opening-vpn.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/02-opening-vpn.png' | relative_url }}" alt="Update-style interface and Android VPN permission prompt">
  <figcaption>The initial update-style interface followed by the Android VPN permission request.</figcaption>
</figure>

That immediately raised the first question:

> **Why would an application presenting itself as an update need a VPN?**

At this stage, that was only a hypothesis.

So I kept going.

---

# 02 — The VPN Lead

After granting the VPN permission, the application appeared as an active VPN service in Android.

I then tested it using:

- PCAPdroid
- HTTP Toolkit
- root-level device inspection

The first network experiment did not reveal an obvious payload download associated with the initial application during this phase.

<!-- IMAGE SLOT
Save the update screen + application storage screenshot as:
assets/images/rbl/03-update-storage.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/03-update-storage.png' | relative_url }}" alt="Update interface and application storage state">
  <figcaption>The update-style interface alongside the application's storage state during testing.</figcaption>
</figure>

That created an interesting contradiction:

```text
VPN is active
      │
      └── but no obvious payload download
```

So I checked the device itself.

```shell
ip addr
```

An active `tun0` interface appeared.

<!-- IMAGE SLOT
Save the VPN blackhole / tun0 and gallery permission screenshot as:
assets/images/rbl/04-tun-gallery.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/04-tun-gallery.png' | relative_url }}" alt="tun0 interface and gallery permission prompt">
  <figcaption>The observed TUN interface and the application's gallery/media access prompt.</figcaption>
</figure>

The initial notes recorded a VPN address of `92.168.50.2/32`. During later static analysis, the corresponding obfuscated configuration resolved to `192.168.50.2/32`; verify the exact runtime value against the original terminal screenshot before publishing.

At this point I had a hypothesis:

> Maybe the VPN was not being used as a conventional VPN connection.

But it was still only a hypothesis.

The next move was to watch what the process was actually doing.

---

# 03 — Stop Looking for a Download

I moved to dynamic instrumentation with Frida.

The first hooks targeted low-level operations:

```text
open()
openat()
write()
connect()
send()
recv()
```

The objective was simple:

> **Find where the application produces the second-stage payload.**

Rather than guessing where the APK was hidden, I wanted the runtime to tell me.

Eventually, it did.

Before continuing, I also checked the package installed by the dropper.

The second-stage package was:

```text
com.vortexirapi.nahusmatrix.alphaakeler
```

SHA-256:

```text
d63f3eb8e8f4edd97ca521fa0f74848d835e35b64a739344c2fb05a2b7865e18
```

MD5:

```text
622f1f758828d455c37d6c4813090cb8
```

<!-- IMAGE SLOT
Save the adb pull / recovered APK screenshot as:
assets/images/rbl/05-payload-pull.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/05-payload-pull.png' | relative_url }}" alt="Pulling the installed second-stage APK">
  <figcaption>The second-stage APK recovered from the installed package on the research device.</figcaption>
</figure>

The rest of the article focuses on how that artifact was produced.

---

# 04 — The 1.5 MB Write

One of the first major breakthroughs was a native `write()` interception:

```text
fd     = 142
length = 1,500,738 bytes
buffer = 0x2620100c
```

The backtrace reached:

```text
libjavacore.so
Linux_writeBytes(...)
```

A subsequent `write()` also transferred `262144` bytes from the same buffer in that run.

<!-- IMAGE SLOT
Save the main Frida write/backtrace screenshot as:
assets/images/rbl/06-frida-write.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/06-frida-write.png' | relative_url }}" alt="Frida intercepting the APK write">
  <figcaption>Frida intercepting the large APK-sized write and showing the Java/native I/O backtrace.</figcaption>
</figure>

This was the point where the investigation moved from speculation into a concrete runtime artifact.

Something approximately 1.5 MB in size was being written.

The next question was obvious:

> **What exactly was inside that buffer?**

---

# 05 — Is That Really an APK?

A large write alone does not prove very much.

So I inspected the actual memory buffer.

The first bytes were:

```text
50 4B 03 04
```

and the buffer contained:

```text
AndroidManifest.xml
```

Those are strong indicators of a ZIP/APK archive.

<!-- IMAGE SLOT
Save the APK hexdump screenshot as:
assets/images/rbl/07-apk-hexdump.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/07-apk-hexdump.png' | relative_url }}" alt="APK buffer beginning with PK 03 04 and containing AndroidManifest.xml">
  <figcaption>The captured buffer begins with <code>PK 03 04</code> and contains <code>AndroidManifest.xml</code>, identifying it as an APK/ZIP archive.</figcaption>
</figure>

The object being written was not merely an arbitrary binary blob.

It was an APK-shaped archive.

---

# 06 — The APK Was Already in Memory

The next question was:

> **Where did those 1,500,738 bytes come from?**

I inspected the memory region containing the buffer:

```text
base       = 0x2485b000
size       = 0x10000000
protection = rw-
file       = anonymous
```

<!-- IMAGE SLOT
Save the memory-range screenshot as:
assets/images/rbl/08-memory-range.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/08-memory-range.png' | relative_url }}" alt="Anonymous read-write memory range containing the APK buffer">
  <figcaption>The APK buffer resides in an anonymous read/write memory range.</figcaption>
</figure>

I then sampled different offsets:

```text
0x0000
0x1000
0x10000
0x100000
```

<!-- IMAGE SLOT
Save the memory inspector screenshot as:
assets/images/rbl/09-memory-inspector.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/09-memory-inspector.png' | relative_url }}" alt="Frida memory inspection at multiple APK offsets">
  <figcaption>Inspecting multiple offsets inside the in-memory object to establish that the APK data spans the buffer.</figcaption>
</figure>

The important observation was that the APK was present throughout the object rather than being only a small header.

This gave me the first strong conclusion:

> **The second-stage APK exists as a complete in-memory object before or while it is being materialized for installation.**

That changed the direction of the investigation.

---

# 07 — The Disappearing `m*.bin`

While watching filesystem activity, I noticed another pattern.

Files resembling:

```text
m<timestamp>.bin
```

were appearing under the application's cache directory.

There were also persistent artifacts such as:

```text
hyzp.bin
cf.xml
.ipk
```

The interesting part was the lifecycle.

The `m*.bin` file could be observed during execution.

After the application finished with it, it was gone.

<!-- IMAGE SLOT
Save the open-watch + cf.xml screenshot as:
assets/images/rbl/10-transient-artifacts.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/10-transient-artifacts.png' | relative_url }}" alt="Transient m-bin artifacts and cf.xml package metadata">
  <figcaption>Runtime filesystem activity revealing temporary <code>m*.bin</code> files alongside persistent artifacts such as <code>hyzp.bin</code>, <code>cf.xml</code>, and <code>.ipk</code>.</figcaption>
</figure>

The `cf.xml` preferences also exposed the installed payload package name:

```text
installed_payload_pkg
com.vortexirapi.nahusmatrix.alphaakeler
```

This was the point where the disappearing `m*.bin` became a primary investigation target.

---

# 08 — Polling Wasn't Enough

My initial approach was filesystem polling.

But a transient file can follow a lifecycle like:

```text
CREATE
  ↓
WRITE
  ↓
READ / INSPECT
  ↓
DELETE
```

before a periodic poll sees it.

So instead of asking:

> "Does the file exist?"

I changed the question to:

> **"Show me when the process opens, writes, closes, and deletes it."**

The observer was expanded to correlate:

```text
FD
PATH
WRITE SIZE
BUFFER
MEMORY RANGE
BACKTRACE
UNLINK
```

After several rounds of debugging and refining the hooks, I had a runtime observer that could follow the artifact lifecycle directly.

<!-- IMAGE SLOT
Save the all-in-one observer startup screenshot as:
assets/images/rbl/11-rbl-all.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/11-rbl-all.png' | relative_url }}" alt="Frida all-in-one runtime observer">
  <figcaption>The refined all-in-one observer instrumenting file, write, network, ART/DEX, and memory events.</figcaption>
</figure>

---

# 09 — Solving the `m*.bin` Mystery

Static analysis of the runtime-generated DEX finally explained the file.

A method equivalent to:

```java
new File(
    getCacheDir(),
    "m" + System.nanoTime() + ".bin"
);
```

creates the temporary file.

The reconstructed APK is written into it.

The application then uses:

```java
PackageManager.getPackageArchiveInfo(...)
```

to inspect the archive and recover its package metadata.

After that:

```java
file.delete();
```

removes the temporary file.

So the lifecycle became:

```text
APK already reconstructed in memory
            │
            ▼
     m<timestamp>.bin
            │
            ▼
  PackageManager parses APK
            │
            ▼
    payload package name
            │
            ▼
         delete
```

This explained why the file was visible in runtime traces but difficult to retrieve manually.

---

# 10 — The 262,144-Byte Mystery

There was another confusing part of the Frida output.

I had seen:

```text
1,500,738 bytes
```

but also:

```text
262,144 bytes
```

At first those looked like potentially different payload writes.

Static analysis clarified the distinction.

The complete APK is first written to the temporary `m*.bin` file for package inspection.

Later, the same APK is passed to Android's `PackageInstaller`, which writes it to the installation session in chunks of:

```text
262144 bytes
```

Conceptually:

```text
Recovered APK
     │
     ├── 1,500,738-byte temporary write
     │
     ▼
PackageManager inspection
     │
     ▼
PackageInstaller
     │
     ├── 262,144
     ├── 262,144
     ├── 262,144
     └── ...
```

This distinction eliminated one of the major ambiguities in the dynamic traces.

---

# 11 — Capturing the Payload

With the acquisition point understood, I refined the instrumentation to capture APK-shaped buffers directly.

The recovered payload was:

```text
Package:
com.vortexirapi.nahusmatrix.alphaakeler
```

Size:

```text
1,500,738 bytes
```

SHA-256:

```text
D63F3EB8E8F4EDD97CA521FA0F74848D835E35B64A739344C2FB05A2B7865E18
```

<!-- IMAGE SLOT
Save the capture / payload files screenshot as:
assets/images/rbl/12-payload-capture.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/12-payload-capture.png' | relative_url }}" alt="Captured payload and transient artifact files">
  <figcaption>The capture directory containing the recovered payload, runtime DEX artifacts, and transient-file captures.</figcaption>
</figure>

A smaller `262144`-byte candidate was also captured during instrumentation:

```text
94276de6055edde838f23ca77baa5a6fa11fa62f75c4d968ca9414939735979f
```

I kept this separately because an APK-shaped buffer is not automatically the final payload.

The full-size artifact was the important one.

---

# 12 — Runtime Capture vs Offline Recovery

At this point dynamic instrumentation had answered:

> **What does the application eventually produce?**

The answer was:

**A second-stage APK.**

But another question remained:

> **How is that APK actually produced?**

That required static analysis.

So the investigation changed from:

```text
runtime → artifact
```

to:

```text
artifact → code → mechanism
```

---

# 13 — Opening the Original APK in JADX

The original APK's `assets/` directory immediately became interesting.

It contained files with names such as:

```text
4bc59cf0.idx
66de998b.dat
831f96aa.cfg
b6d9b4c6.bin
eb659c71.bin
nvcgehin
```

Nothing about those filenames immediately explained their purpose.

That was exactly where the runtime evidence became useful.

I already knew that the application could produce a valid APK.

Now I wanted to find the code responsible for producing it.

<!-- IMAGE SLOT
Save the JADX assets screenshot as:
assets/images/rbl/13-assets.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/13-assets.png' | relative_url }}" alt="Interesting encrypted-looking assets in JADX">
  <figcaption>The original APK contains multiple obfuscated-looking assets with non-descriptive filenames.</figcaption>
</figure>

---

# 14 — Finding the Loader

Two classes inside:

```text
azpgyj.iddap
```

stood out:

```text
jfpxv
hulfg
```

These contained:

- obfuscated strings
- custom byte transformations
- HMAC-SHA256
- AES-GCM
- DEFLATE decompression
- runtime DEX-loading logic

<!-- IMAGE SLOT
Save the jfpxv / hulfg JADX screenshot as:
assets/images/rbl/14-loader-classes.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/14-loader-classes.png' | relative_url }}" alt="jfpxv and hulfg loader classes in JADX">
  <figcaption>The two classes that exposed the payload reconstruction and cryptographic logic.</figcaption>
</figure>

The code looked unpleasant at first, but the data flow turned out to be systematic.

---

# 15 — Reconstructing the Decryption Pipeline

The loader follows roughly this pipeline:

```text
Embedded encrypted asset
          │
          ▼
      custom "uncloak"
          │
          ├── LCG permutation
          ├── nibble swap
          └── SHA-256 keystream XOR
          │
          ▼
     salt + nonce + ciphertext
          │
          ▼
      key derivation
          │
          ▼
        AES-GCM
          │
          ▼
    compression flag
          │
          ▼
      optional DEFLATE
          │
          ▼
         APK
```

This was the missing connection between the strange assets and the APK observed in memory.

The payload wasn't simply sitting in plaintext inside the application's assets.

It was being reconstructed at runtime.

---

# 16 — Building an Offline Decryptor

Once the transformation logic was understood, I implemented the recovered transformation in Python.

The decryptor reproduced:

```text
uncloak
→ key derivation
→ AES-GCM
→ optional DEFLATE
```

and produced an APK.

<!-- IMAGE SLOT
Save the decryptor terminal screenshot as:
assets/images/rbl/15-decryptor.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/15-decryptor.png' | relative_url }}" alt="Python decryptor producing the recovered APK">
  <figcaption>The offline decryptor reconstructing the second-stage APK from the embedded asset.</figcaption>
</figure>

The recovered APK had:

```text
Size:
1,500,738 bytes
```

SHA-256:

```text
D63F3EB8E8F4EDD97CA521FA0F74848D835E35B64A739344C2FB05A2B7865E18
```

This gave me two independent acquisition paths:

```text
               Payload
                  ▲
                  │
        ┌─────────┴─────────┐
        │                   │
   Runtime capture     Offline decryptor
        │                   │
        └──── SHA-256 ──────┘
                  │
                MATCH
```

That was the validation point I needed.

---

# 17 — The Runtime DEX

The `hyzp.bin` runtime artifact could then be opened in JADX.

This was where the architecture became much clearer.

The original class names were heavily obfuscated, so I renamed the important classes according to their observed functions.

These are **analyst-defined names**, not names assigned by the original developer.

<!-- IMAGE SLOT
Save the JADX hyzp.bin screenshot as:
assets/images/rbl/16-hyzp-jadx.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/16-hyzp-jadx.png' | relative_url }}" alt="hyzp.bin opened in JADX">
  <figcaption>The runtime-generated DEX reveals the classes responsible for VPN setup, payload loading, installation, and handoff.</figcaption>
</figure>

---

# 18 — `VpnTunnelService`

The original class:

```text
ybgruj
```

extends Android's:

```java
VpnService
```

Its role can be summarized as:

```text
VPN permission
      ↓
create TUN interface
      ↓
configure IPv4 / IPv6
      ↓
add default routes
      ↓
exclude selected applications
      ↓
read from TUN
```

The class uses a full-route configuration and a background packet-drain thread.

The excluded application list includes communication and dialer applications such as WhatsApp, Telegram, Facebook Messenger, dialer packages, Meet, and Skype.

<!-- IMAGE SLOT
Save the VPN class screenshot as:
assets/images/rbl/17-vpn-service.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/17-vpn-service.png' | relative_url }}" alt="ybgruj VpnService class in JADX">
  <figcaption>The obfuscated <code>ybgruj</code> class implements the Android VPN/TUN service.</figcaption>
</figure>

The decoded VPN configuration is:

```text
IPv4 address : 192.168.50.2/32
IPv6 address : fd00::2/128
IPv4 route   : 0.0.0.0/0
IPv6 route   : ::/0
DNS          : 192.168.50.1
```

In the analyzed service class, I did not find conventional upstream VPN forwarding logic. The TUN descriptor is read by a background thread, but the read data is not forwarded elsewhere within that class.

So the evidence supports calling it:

> **a full-route Android VPN/TUN service with a packet-draining loop**

rather than assuming it is a conventional VPN tunnel.

---

# 19 — The Application Exclusions

The VPN service explicitly excludes a hard-coded list of applications from the VPN.

<!-- IMAGE SLOT
Save the BYPASS array screenshot as:
assets/images/rbl/18-vpn-bypass.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/18-vpn-bypass.png' | relative_url }}" alt="Hard-coded application bypass list">
  <figcaption>The VPN service excludes a hard-coded set of messaging, calling, and communication applications.</figcaption>
</figure>

This is an observation from the code.

The reason for the exclusions requires correlation with the rest of the payload and runtime behaviour.

---

# 20 — `PayloadInstallerActivity`

The original class:

```text
mtpgw
```

acts as the main UI and installation controller.

For analysis, I renamed it:

```text
PayloadInstallerActivity
```

Its high-level workflow is:

```text
store/update-style UI
        ↓
request install permission
        ↓
request VPN permission
        ↓
call PayloadLoader
        ↓
obtain complete APK byte[]
        ↓
create temporary m*.bin
        ↓
inspect package metadata
        ↓
PackageInstaller
        ↓
launch payload
        ↓
shut down the dropper
```

<!-- IMAGE SLOT
Save the PayloadInstallerActivity screenshot as:
assets/images/rbl/19-payload-installer.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/19-payload-installer.png' | relative_url }}" alt="PayloadInstallerActivity functional mapping">
  <figcaption>Functional mapping of the main installer activity reconstructed from the obfuscated class.</figcaption>
</figure>

This class tied several previously unrelated runtime observations together.

---

# 21 — `PayloadInstallReceiver`

The original class:

```text
ecjqh
```

was renamed:

```text
PayloadInstallReceiver
```

Its role is to handle the post-install stage.

Conceptually:

```text
PackageInstaller result
        │
        ▼
payload package identified
        │
        ▼
launch payload
        │
        ▼
check whether process is running
        │
        ▼
retry if necessary
```

<!-- IMAGE SLOT
Save the PayloadInstallReceiver screenshot as:
assets/images/rbl/20-payload-receiver.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/20-payload-receiver.png' | relative_url }}" alt="PayloadInstallReceiver functional mapping">
  <figcaption>The receiver handles installation results and repeatedly attempts to launch the installed payload.</figcaption>
</figure>

The receiver reacts to package-installation events and also handles PackageInstaller status information.

This explains why the second-stage package can be launched immediately after installation.

---

# 22 — `PayloadLoader`

The original class:

```text
htjy
```

was renamed:

```text
PayloadLoader
```

Its role is to turn the embedded asset into the final APK.

```text
read embedded asset
        ↓
uncloak
        ↓
derive key
        ↓
AES-GCM decrypt
        ↓
optional DEFLATE
        ↓
APK byte[]
```

<!-- IMAGE SLOT
Save the PayloadLoader screenshot as:
assets/images/rbl/21-payload-loader.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/21-payload-loader.png' | relative_url }}" alt="PayloadLoader functional mapping">
  <figcaption>The loader reconstructs the second-stage APK from the embedded encrypted asset.</figcaption>
</figure>

This is the component that explains the **1,500,738-byte in-memory APK** observed during dynamic analysis.

---

# 23 — `ObfuscatedConstants`

The original class:

```text
bdsb
```

was renamed:

```text
ObfuscatedConstants
```

It is essentially the shared string/configuration resolver.

```text
decode XOR strings
decode hex-XOR strings
installer constants
VPN configuration
Android API names
PackageInstaller extras
```

<!-- IMAGE SLOT
Save the ObfuscatedConstants screenshot as:
assets/images/rbl/22-obfuscated-constants.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/22-obfuscated-constants.png' | relative_url }}" alt="ObfuscatedConstants functional mapping">
  <figcaption>The shared obfuscation/constants class decoded during static analysis.</figcaption>
</figure>

Once these strings were decoded, much of the surrounding code became straightforward to interpret.

---

# 24 — Five Classes, One Pipeline

The five major components can now be summarized as:

```text
ognmpy.klcumpi
│
├── VpnTunnelService
├── PayloadInstallerActivity
├── PayloadInstallReceiver
├── PayloadLoader
└── ObfuscatedConstants
```

Their roles:

```text
ObfuscatedConstants
        ↑
        │ shared strings/config
        │
PayloadInstallerActivity
        │
        ├───────────────┐
        │               │
        ▼               ▼
PayloadLoader     VpnTunnelService
        │
        ▼
   APK byte[]
        │
        ▼
 PackageInstaller
        │
        ▼
PayloadInstallReceiver
        │
        ▼
  launch payload
```

<!-- IMAGE SLOT
Save your final architecture/summary diagram as:
assets/images/rbl/23-final-architecture.png
-->

<figure>
  <img src="{{ '/assets/images/rbl/23-final-architecture.png' | relative_url }}" alt="Final reconstructed dropper architecture">
  <figcaption>The final architecture reconstructed by combining dynamic and static analysis.</figcaption>
</figure>

---

# 25 — The Complete Evidence Chain

After combining dynamic and static analysis, the execution chain became:

```text
INITIAL APK
    ↓
embedded encrypted asset
    ↓
runtime reconstruction
    ↓
APK-sized anonymous memory buffer
    ↓
1,500,738-byte write
    ↓
temporary m<timestamp>.bin
    ↓
PackageManager package inspection
    ↓
PackageInstaller
    ↓
installed second-stage APK
    ↓
payload launch
```

The investigation started with a UI and a strange VPN request.

It ended with a reproducible loader/install/handoff chain.

---

# 26 — What Was Proven

One of the most important parts of the investigation was separating observations from assumptions.

### Confirmed

```text
✓ The initial application reconstructs a second-stage APK at runtime.

✓ The complete APK exists in process memory.

✓ The APK is written to a transient m*.bin file.

✓ Package metadata is read from the temporary archive.

✓ The temporary file is deleted.

✓ The APK is passed through PackageInstaller.

✓ The installed package is launched.

✓ The runtime-captured APK matches the offline reconstruction by SHA-256.
```

### Still open

```text
? What exact role does the VPN play beyond establishing the TUN interface?

? Does another component consume or forward TUN traffic?

? What does the installed payload do after handoff?

? What infrastructure does the payload communicate with?

? What commands or capabilities are implemented by the second stage?
```

Those questions are deliberately left for Part 2.

---

# 27 — What I Initially Thought vs What the Evidence Showed

The most useful part of the investigation was watching the hypothesis change.

### Initially

> Maybe the VPN is hiding a payload download.

### Runtime

> No obvious download. But a complete APK appears in memory.

### Next

> Maybe `m*.bin` is the actual installation artifact.

### Static analysis

> `m*.bin` is a temporary APK staging file used for package inspection.

### Initially

> Maybe the 262 KB writes represent another payload.

### Static analysis

> They are chunked PackageInstaller writes.

### Final understanding

> The payload is reconstructed locally, briefly materialized, inspected, installed, and launched.

That progression is the real story of the investigation.

---

# 28 — Artifacts Collected

## Initial sample

```text
Package:
ognmpy.klcumpi

SHA-256:
b6d3d866d598c91a49b6ab9a8bde75db9cee679d890ddef3a8827d938a6135fd

MD5:
635a75e3bef45740e20deda24fe7eca1
```

## Recovered second-stage payload

```text
Package:
com.vortexirapi.nahusmatrix.alphaakeler

SHA-256:
D63F3EB8E8F4EDD97CA521FA0F74848D835E35B64A739344C2FB05A2B7865E18

MD5:
622f1f758828d455c37d6c4813090cb8

Size:
1,500,738 bytes
```

## Runtime DEX artifact

```text
hyzp-48408b-20260921_161732_315779.bin

SHA-256:
827201c6c26c98478bf732e931e3866cde970b8d7ecdfb94a5219699d71a9df9
```

A second runtime capture was also recorded:

```text
hyzp-8b-20260921_161732_330272.bin

SHA-256:
7c9fa136d4413fa6173637e883b6998d32e1d675f88cddff9dcbcf331820f4b8
```

---

# 29 — The Investigation in One Diagram

```text
                    INITIAL APK
                         │
                         ▼
             Update-style interface
                         │
                         ▼
                    VPN request
                         │
                         ▼
                 Runtime execution
                         │
                         ▼
                 PayloadLoader
                         │
                 decrypt / unpack
                         │
                         ▼
                  complete APK
                    in memory
                         │
                         ▼
              m<timestamp>.bin
                         │
                         ▼
               package inspection
                         │
                         ▼
                 PackageInstaller
                         │
                         ▼
              PayloadInstallReceiver
                         │
                         ▼
                   launch payload
```

---

# 30 — What I Learned

The biggest lesson wasn't AES-GCM.

It wasn't Frida.

It wasn't JADX.

It was **following artifacts instead of assumptions**.

The investigation started with:

> Why does this app need a VPN?

Then:

> Why is there no obvious network download?

Then:

> What is that 1.5 MB write?

Then:

> Why does an `m*.bin` appear and immediately disappear?

Then:

> Where does that APK come from?

Each question came from the previous observation.

That is what eventually turned a roughly 1.4 MB obfuscated APK into an understandable execution chain.

---

# Part 1 — Final Takeaway

The initial application is not simply a single APK whose complete functionality is visible in plaintext.

Instead, the observed architecture is a **multi-stage loader/installer**:

1. It presents an update-style interface.
2. It establishes an Android VPN/TUN service.
3. It reconstructs a second-stage APK at runtime.
4. The complete APK exists in memory.
5. A transient `m<timestamp>.bin` file is used during package inspection.
6. The APK is passed to Android's `PackageInstaller`.
7. A receiver handles the installation result and launches the new package.
8. The initial application eventually hands execution over to the installed payload.

The recovered second-stage APK was independently captured at runtime and reconstructed offline, and both produced the same SHA-256:

```text
D63F3EB8E8F4EDD97CA521FA0F74848D835E35B64A739344C2FB05A2B7865E18
```

---

# Part 2 — What's Inside the Payload?

Part 1 answered:

> **How does the second-stage APK get there?**

Part 2 will answer:

> **What does the second-stage APK actually do?**

The next stage will move into:

```text
SECOND-STAGE APK
        │
        ├── Manifest
        ├── permissions
        ├── Activities
        ├── Services
        ├── Receivers
        ├── network infrastructure
        ├── command handling
        ├── data collection
        └── IOCs
```

The dropper was only the outer layer.

---

# Final Thoughts

The most satisfying moment in this investigation wasn't finding the APK.

It was understanding **how the APK got there**.

A random-looking cache file became a package-inspection artifact.

A 262 KB write became a PackageInstaller chunk.

An anonymous memory region became the source of the complete payload.

And five meaningless class names became:

```text
PayloadLoader
PayloadInstallerActivity
PayloadInstallReceiver
VpnTunnelService
ObfuscatedConstants
```

The malware didn't become simple.

**My understanding of it became simpler.**

And that's probably the most useful thing reverse engineering gives you:

> **You don't need to understand everything at once. You need to keep following the evidence until the pieces connect.**

---

## Appendix — Tooling

```text
Static:
JADX
Ghidra
Apktool

Dynamic:
Frida
ADB
PCAPdroid
HTTP Toolkit

Analysis:
Wireshark
Python
sha256sum
file
```

---

## Disclaimer

This research was conducted in a controlled test environment using a dedicated Android research device.

Do not execute unknown APKs on personal or production devices.

---

> **Part 1: How the payload gets there.**  
> **Part 2: What the payload does once it gets there.**
