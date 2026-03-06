# INAV Web GCS

Lightweight Cross-Platform Ground Control Station for **INAV Flight Controllers**

INAV Web GCS is a lightweight cross-platform **Ground Control Station (GCS)** for INAV flight controllers.

It provides a modern **map-based mission planner**, **live telemetry**, and multiple connection methods including **USB**, **LoRa telemetry**, and **WiFi bridges**.

The project is built using modern web technologies and runs on:

• Desktop (Windows / Linux / Mac)  
• Android devices  
• Web browsers (via ESP32 bridge)

The goal of this project is to provide a **simple, lightweight, and cross-platform GCS** without requiring heavy native applications.

This project is built to support the **INAV ecosystem** and provide additional tools for the community.

---

## Project Motivation

Over the years, whenever I felt the need for a Ground Control Station while using **INAV**, the common suggestion from the community was:

*"Just move to ArduPilot or PX4."*

While those ecosystems have excellent ground stations, I really liked the simplicity and reliability of **INAV** and wanted to continue using it for my projects.

However, there was no lightweight **cross-platform GCS specifically designed for INAV** that worked easily across desktop, Android, and browsers.

So I decided to build one.

**INAV Web GCS** started as a personal tool to solve my own workflow needs in the field.  
With time it evolved into something that could be useful for other pilots as well.

By sharing this project publicly, my goal is simply to contribute something back to the **INAV community**.

If it helps even a few INAV users plan missions, monitor telemetry, or experiment with long-range setups, then this small effort has served its purpose.

I’m happy to see others use it, improve it, or build on top of it.

---

## Features

• Interactive map-based mission planner  
• Waypoint creation and editing  
• Drag-and-drop waypoint repositioning  
• Mission polyline visualization  
• Live drone position tracking  
• Home point detection on arm  
• Live flight trail visualization  
• Smooth drone position rendering  
• Telemetry display (GPS, satellites, speed, heading, etc.)

---

## Platforms & Connectivity

### Desktop (Windows / Linux / Mac)

Connection method:

FC UART → LoRa (Air) ⇄ LoRa (Ground) → USB → GCS

Uses:

WebSerial API

No additional hardware required besides the ground LoRa module.

---

### Android

Connection method:

FC UART → LoRa (Air) ⇄ LoRa (Ground) → USB OTG → Android GCS App

Uses:

Native Android USB bridge.

---

### iOS

iOS browsers **do not support WebSerial**, so direct USB connections are not possible.

Connection method:

FC UART → LoRa (Air) ⇄ LoRa (Ground) → ESP32 → WiFi → Browser (GCS)

Uses:

WebSocket bridge.

---

## Hardware Stack

The system uses **LoRa-900A modules configured as transparent serial bridges** to provide long-range telemetry between the drone and the Ground Control Station.

The LoRa modules act as a **wireless UART extension**, allowing MSP data from the flight controller to be transmitted wirelessly.

### Drone Side

• INAV Flight Controller  
• LoRa-900A module (UART connection)

### Ground Side

• LoRa-900A module  
• USB connection or OTG connection  
• PC / Android device / Tablet

### Optional WiFi Bridge

• ESP32 module (for iOS / browser connectivity)

### Communication Protocols

• MSP (MultiWii Serial Protocol)  
• UART Serial  
• LoRa transparent serial communication  
• WebSerial  
• WebSocket

---

## Field Communication Architecture

Drone Side

Flight Controller  
↓  
UART  
↓  
LoRa-900A (Air Unit)

Wireless Link

LoRa RF Communication

Ground Side

LoRa-900A (Ground Unit)  
↓  
USB Serial / OTG  
↓  
Ground Control Station

---

## Connection Flows

### Desktop USB Connection

Hardware Flow

Flight Controller  
↓  
UART  
↓  
LoRa-900A (Air)  
⇅ LoRa RF Link ⇅  
LoRa-900A (Ground)  
↓  
USB  
↓  
PC / Laptop

Software Flow

Flight Controller  
↓  
MSP Serial  
↓  
LoRa Transparent Serial Link  
↓  
WebSerial API  
↓  
INAV Web GCS

Steps

1. Power the drone LoRa module  
2. Power the ground LoRa module  
3. Connect ground LoRa module to PC via USB  
4. Open INAV Web GCS  
5. Click Connect  
6. Telemetry begins

---

### Android USB Connection

Hardware Flow

Flight Controller  
↓  
UART  
↓  
LoRa-900A (Air)  
⇅ LoRa RF Link ⇅  
LoRa-900A (Ground)  
↓  
USB OTG  
↓  
Android Device

Software Flow

Flight Controller  
↓  
MSP Serial  
↓  
LoRa Transparent Serial Link  
↓  
Android USB Bridge  
↓  
INAV Web GCS

Steps

1. Connect ground LoRa module to Android device using OTG  
2. Open INAV Web GCS Android app  
3. Grant USB permission  
4. Click Connect  
5. Telemetry begins

---

### WiFi Connection (ESP32 Bridge)

Used mainly for:

• iOS devices  
• Browser based access  
• Wireless tablet setups

Hardware Flow

Flight Controller  
↓  
UART  
↓  
LoRa-900A (Air)  
⇅ LoRa RF Link ⇅  
LoRa-900A (Ground)  
↓  
UART / USB  
↓  
ESP32  
↓  
WiFi  
↓  
Phone / Tablet / Browser

Software Flow

Flight Controller  
↓  
MSP Serial  
↓  
LoRa Transparent Serial Link  
↓  
ESP32 Serial Bridge  
↓  
WebSocket  
↓  
INAV Web GCS

Steps

1. Connect ground LoRa module to ESP32  
2. Power ESP32  
3. Connect device to ESP32 WiFi network  
4. Open INAV Web GCS in browser  
5. Connect via WebSocket

---

## Why LoRa is Used

LoRa modules provide:

• Long-range telemetry  
• Low power consumption  
• Reliable communication in remote areas  
• Transparent serial communication

The modules act as a **wireless UART cable**, passing MSP packets between the drone and ground station without modification.

---

## Tech Stack

Frontend

• TypeScript  
• Vite  
• Leaflet.js  
• FontAwesome

Communication

• MSP (MultiWii Serial Protocol)  
• WebSerial API  
• WebSocket bridge

Desktop

• Tauri

Android

• Capacitor  
• Native USB bridge

---

## Supported Firmware

INAV Flight Controllers

Tested with:

• INAV 8.x firmware  
• SpeedyBee F7 flight controller

----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
