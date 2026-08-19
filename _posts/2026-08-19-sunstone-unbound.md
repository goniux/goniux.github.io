---
layout: post
title: "Sunstone Unbound: Rooting Redmi Note 12 5G"
date: 2026-08-19 
category: "Mobile Security"
tags: [android, xiaomi, hyperos, rooting, magisk, adb, mobile-security, security-research]
description: "My documented Xiaomi HyperOS bootloader-unlock and rooting workflow, including two community unlock-request methods and the lessons I learned getting the timing right."
---

# Sunstone Unbound

> I didn't root my phone because I wanted another customization project. I wanted a device I could actually research.

This is the story and documentation of how I prepared my Xiaomi phone for Android security research.

I wanted a device where I could go deeper than a normal stock installation allows me to go — inspect the filesystem, instrument applications, analyse Android malware, experiment with system behaviour, and work with tools such as Frida, JADX, Ghidra, Apktool, MobSF and ADB.

The hard part wasn't installing Magisk.

**The hard part was getting through Xiaomi's newer bootloader-unlock process.**

Information was scattered across YouTube videos, community posts, scripts, XDA discussions and documentation. So I decided to put the workflow I actually used into one place.

This is **Sunstone Unbound**.

---

## ⚠️ Before You Touch Anything

This documents my own experience, not a universal Xiaomi rooting recipe.

Bootloader unlocking and firmware modification can wipe your device, make it fail to boot, require a firmware restore, change the device's security posture, or affect support/warranty depending on region and policy.

**Back up your data first.**

Verify the current requirements for your exact Xiaomi model, region, HyperOS version and account before doing anything. Xiaomi changes its unlock process.

---

## 01 — Why I Wanted Root

My motivation was cybersecurity.

A stock Android device is intentionally restrictive. That is generally good for normal users, but it can become an obstacle when the goal is understanding the operating system and applications at a deeper level.

For a dedicated research device, elevated access can make experiments such as these much easier:

- Android malware analysis
- filesystem inspection
- runtime instrumentation
- Frida research
- application behaviour analysis
- system-level debugging
- certificate/network research
- kernel and boot-image experimentation
- reverse engineering
- security-control testing

Root doesn't automatically make a phone a security-research device.

It simply gives the researcher another layer of control.

---

## 02 — The Big Picture

```text
Xiaomi / HyperOS device
        │
        ▼
Prepare Xiaomi account + device
        │
        ▼
Meet Mi Community unlock requirements
        │
        ▼
Get through the unlock-request quota
        │
        ▼
Wait for Xiaomi permission / eligibility
        │
        ▼
Mi Unlock Tool
        │
        ▼
BOOTLOADER UNLOCKED
        │
        ▼
Obtain correct official firmware
        │
        ▼
Prepare the required boot image
        │
        ▼
Patch with Magisk
        │
        ▼
Flash using the device-specific method
        │
        ▼
Verify root
        │
        ▼
Android research environment
```

The first major obstacle was the **unlock request**.

---

## 03 — HyperOS Changed the Game

Newer HyperOS devices introduced additional restrictions around the unlock process.

Depending on the device and region, the process can involve:

- a Xiaomi/Mi account;
- account-device binding;
- Mi Community requirements;
- an unlock request;
- a daily server-side quota;
- an eligibility/waiting period;
- the official Mi Unlock tool.

That daily quota is where things became interesting.

---

## 04 — Two Community Workflows

I ended up using **two different community-developed approaches**.

> **I did not write these original tools from scratch. I found them through the Android/Xiaomi security community, studied how they worked, used them during my own unlock attempt, and am documenting them here with links back to their original sources.**

The two approaches solve slightly different parts of the unlock problem.

---

## 05 — Method One: HyperOS Unlock Request

The first workflow automates the HyperOS/Mi Community unlock-request process.

The general idea:

```text
Mi Community
      │
      ▼
Unlock Bootloader page
      │
      ▼
Prepare account/device
      │
      ▼
Submit request around quota reset
      │
      ▼
Wait for Xiaomi permission
```

### Source

**YouTube:** `[https://youtu.be/NQrbkngtDdY?si=lYWVlg8N16ivS_B1]`

**My GitHub collection:**  
https://github.com/goniux/sunstone-unlocking-script

---

## 06 — Method Two: Mi Community Unlock Automation

The second workflow I used was **micommunity-unlock-request-automate**.

It is a Python-based approach that automates the Mi Community unlock request through ADB.

The workflow uses:

- ADB
- Python
- NTP time synchronization
- `adbutils`
- `ntplib`

### Requirements

The original workflow specifies:

```text
USB Debugging
USB Debugging (Security settings)  [where applicable]
OEM Unlocking
A bound Mi account meeting the current requirements
Python 3.10+
ntplib
adbutils
```

Install Python dependencies with:

```shell
pip install -r requirements.txt
```

### Source

**YouTube:** `[https://m.youtube.com/watch?v=d4ra7ZrWRiY&t=244s&pp=2AH0AZACAQ%3D%3D]`

**My GitHub collection:**  
https://github.com/goniux/sunstone-unlocking-script

---

## 07 — Mi Community Setup

One resource I used during the setup was:

[Mi Community — Redmi Phone](https://new-ams.c.mi.com/global/forum-type/Redmi%20Phone)

The general setup was:

```text
1. Open Mi Community.
2. Select the appropriate global/India region.
3. Navigate to the bootloader-unlock section.
4. Keep the relevant page open.
5. Connect the phone through ADB.
6. Prepare the automation.
7. Wait for the quota reset boundary.
```

### Cookie Editor

The Firefox Cookie Editor extension used in the original setup:

[Cookie Editor — Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

**Never publish your own cookies, tokens, session values or account credentials.**

---

## 08 — Additional Reference Material

Another reference I used while piecing together the workflow:

[Bootloader Permission Setup / reference document](https://docs.google.com/document/u/0/d/1mxuR9kgCbU8-IAVYjWYCNX5ch-pzOjzGrWgYY_jzimg/mobilebasic)

The original workflow involves browser/account preparation and token handling.

Again:

> **Never commit real authentication tokens or browser cookies to GitHub.**

---

## 09 — The Timing Problem

The unlock-request quota is associated with a reset at:

```text
00:00 Beijing time (UTC+8)
```

India is:

```text
UTC+5:30
```

Therefore:

```text
00:00 Beijing
      =
21:30 IST
(previous calendar day)
```

So the critical boundary for me was:

> **21:30 IST = 00:00 Beijing**

---

## 10 — Why I Started Around 21:25 IST

I didn't want to start everything at exactly the reset time.

I prepared the environment several minutes beforehand.

My rough timeline was:

```text
21:25 IST
│
├── Device connected
├── ADB checked
├── Mi Community page prepared
├── Account state checked
├── Scripts prepared
└── Time synchronization verified
│
▼
21:29 IST
│
├── Final preparation
└── Wait for reset boundary
│
▼
21:30:00 IST
=
00:00:00 Beijing
│
▼
Unlock request window
```

The goal was not simply "click as fast as possible."

The goal was to make sure **everything before the final request was already done**.

---

## 11 — Milliseconds Matter

There is a difference between:

```text
"my laptop says midnight"
```

and:

```text
"the system executing the request has an accurately synchronized
clock and the request reaches the service around the quota-reset boundary."
```

There are multiple sources of delay:

```text
Local clock
    │
    ▼
NTP synchronization
    │
    ▼
Python scheduling
    │
    ▼
ADB communication
    │
    ▼
Android UI / app
    │
    ▼
Network transmission
    │
    ▼
Server-side processing
```

Even when a local action takes milliseconds, the total path is not zero-latency.

The automation I used therefore did not simply rely on a hard-coded local `sleep()`. It synchronized time and calculated the target boundary.

---

## 12 — What I Actually Did

**I used both methods.**

Rather than blindly choosing one, I studied both workflows and combined the useful parts for my own attempt.

Conceptually:

```text
Method 1
HyperOS unlock workflow
        │
        ├──────────────┐
        │              │
        ▼              ▼
Account / request   Unlock preparation
        │              │
        └──────┬───────┘
               │
               ▼
       Method 2 automation
               │
               ▼
        NTP synchronized
               │
               ▼
        21:30 IST boundary
               │
               ▼
       Unlock request attempt
```

I started preparing around **21:25 IST** and targeted the **21:30 IST / 00:00 Beijing** boundary.

In my successful attempt, I ran the final sequence around the reset window and got the request through.

I am documenting this as my observed workflow, **not as a guaranteed formula**.

---

## 13 — The Important Reality

This:

```text
21:30 IST
+
specific script
+
specific number of clicks
=
guaranteed unlock
```

is **not** a universal formula.

Xiaomi can change:

- quota behaviour;
- account eligibility;
- regional restrictions;
- server-side checks;
- Mi Community behaviour;
- waiting periods;
- unlock policies;
- API behaviour.

The useful lesson is:

> **Prepare everything before the reset boundary and understand the timing path instead of blindly clicking at midnight.**

---

## 14 — Mi Community Automation

The original `micommunity-unlock-request-automate` workflow exposes options similar to:

```shell
Usage: automate.py [-h] [--clicks CLICKS] [--delay DELAY] [--test]
                   [--test-timezone TEST_TIMEZONE]
                   [--test-time TEST_TIME]

Python script to automate Mi Community unlock request at 00:00 Beijing time via ADB
```

The documented options include:

```text
--clicks
    Number of clicks

--delay
    Delay between clicks

--test
    Run in test mode

--test-timezone
    Timezone offset used for test mode

--test-time
    Target time used for test mode
```

Example:

```shell
python automate.py
```

Test mode:

```shell
python automate.py --test --test-timezone 2 --test-time 16:20
```

Understand the script before modifying timing or click parameters. More automated clicks are not automatically better.

---

## 15 — After Unlocking

Once Xiaomi accepted the request and the required waiting period was satisfied, I moved to the actual bootloader unlock.

For my device, the displayed waiting period was approximately:

> **67 hours**

This is **not a universal waiting time**.

Your account/device may receive a different value.

---

## 16 — Mi Unlock

The next stage was Xiaomi's official Mi Unlock tooling.

```text
Device
   │
   ▼
Fastboot / unlock mode
   │
   ▼
Mi Unlock
   │
   ▼
Xiaomi account verification
   │
   ▼
Bootloader unlocked
```


## 17 — Getting the Correct Firmware

After unlocking the bootloader, I needed the firmware package corresponding
to my exact device and region.

My device:

```text
Device:       Redmi Note 12 5G
Codename:     sunstone
Region:       India
Firmware:     OS2.0.5.0.UMQINXM
Android:      14
Type:         Fastboot ROM
After unlocking, I used the appropriate official Xiaomi firmware for my device.

**Official firmware source:**

`https://mifirmware.com/redmi-note-12-firmware`

Do not blindly flash a boot image because someone with the same phone model used it. A mismatched image can result in a device that doesn't boot.

---

## 18 — Magisk

The next stage was preparing the relevant boot image for Magisk.

```text
Official firmware
       │
       ▼
Locate correct boot/init_boot image
       │
       ▼
Patch with Magisk
       │
       ▼
Patched image
       │
       ▼
Flash using the correct device-specific procedure
       │
       ▼
Boot Android
       │
       ▼
Verify
```

The exact partition and flashing procedure depends on the device and firmware.

**Do not assume every Xiaomi device uses the same image or partition layout.**


## 19 — Root Verification

After booting Android again, I verified the root environment.

For example:

```shell
adb shell
```

and:

```shell
id
```

A privileged shell may report:

```text
uid=0(root)
```

But don't treat one command as proof that the entire root setup is healthy.

Check:

- Magisk functionality;
- root permission prompts;
- device boot stability;
- expected system behaviour;
- SELinux state;
- whether your research tools work as expected.



## 20 — My Android Security Lab

Once the phone was rooted, it became much more useful for the work I actually wanted to do.

My Android research toolbox includes:

```text
ADB
Termux
Magisk
Frida
JADX
Ghidra
Apktool
MobSF
HTTP Toolkit
Burp Suite
Android Studio
```

Typical workflow:

```text
                 APK
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
   Static Analysis     Dynamic Analysis
        │                   │
   JADX / Apktool       Frida / ADB
   Ghidra / MobSF           │
        │                   │
        └─────────┬─────────┘
                  ▼
             Behaviour
                  │
                  ▼
          Network Analysis
                  │
          HTTP Toolkit / Burp
```

That's what I actually wanted from rooting:

**a controlled Android research environment.**

---

## 22 — Scripts & Source Code

I've collected the scripts I used here:

## `goniux/sunstone-unlocking-script`

**GitHub:**

https://github.com/goniux/sunstone-unlocking-script

The repository is separate from this article so the scripts can evolve independently.

It will contain:

```text
scripts
requirements
setup instructions
source attribution
usage examples
```

I also want the repository README to be useful to beginners rather than assuming that everyone already understands ADB, Python, Mi Community or bootloader terminology.

### Important

**Never commit your own:**

```text
cookies
session tokens
Mi account credentials
browser exports
authentication secrets
```

to the repository.

Those should remain local.

---

## 23 — Credits & References

This guide combines information from multiple community sources.

### Method 1 — HyperOS unlock workflow

**YouTube:**  
`[ https://youtu.be/NQrbkngtDdY?si=lYWVlg8N16ivS_B1 ]`

### Method 2 — Mi Community unlock automation

**YouTube:**  
`[ https://m.youtube.com/watch?v=d4ra7ZrWRiY&t=244s&pp=2AH0AZACAQ%3D%3D ]`

### Mi Community

[Mi Community — Redmi Phone](https://new-ams.c.mi.com/global/forum-type/Redmi%20Phone)

### Cookie Editor

[Cookie Editor — Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### Additional reference

[Bootloader Permission Setup document](https://docs.google.com/document/u/0/d/1mxuR9kgCbU8-IAVYjWYCNX5ch-pzOjzGrWgYY_jzimg/mobilebasic)

### Community reference

The `micommunity-unlock-request-automate` workflow credits community research including:

[Reddit reference](https://www.reddit.com/r/Android/comments/1mgn0yj/xiaomis_bootloader_unlock_system_is_broken_heres)

### XDA reference

[Mi Unlock / GetToken / AQLR discussion on XDA](https://xdaforums.com/t/how-to-unlock-bootloader-on-xiaomi-hyperos-all-devices-except-cn.4654009)

---

# 24 — Final Thoughts

I didn't root this phone because I wanted another phone customization project.

I wanted to understand the machine I was using.

A smartphone is an extremely capable computer that most people interact with through a heavily restricted interface.

For normal users, those restrictions make sense.

For security research, sometimes you need to go deeper.

The most valuable part of this whole process wasn't getting a green checkmark from Magisk.

It was understanding the chain:

```text
Account
  ↓
Eligibility
  ↓
Quota
  ↓
Timing
  ↓
Unlock
  ↓
Firmware
  ↓
Boot image
  ↓
Magisk
  ↓
Root
  ↓
Research
```

**Root gave me access.**

Understanding what that access means is the real work.

---

> **If this guide saves someone several hours of digging through scattered tutorials, it has done its job.**

— Goni

---

## Disclaimer

This article is for educational and authorized security-research purposes.

Bootloader unlocking, rooting, firmware modification and kernel experimentation can cause data loss or render a device unbootable.

Always use the correct files for your exact device and firmware, follow current official Xiaomi requirements, and maintain a recovery path before modifying the boot chain.

**You are responsible for what you flash.**
