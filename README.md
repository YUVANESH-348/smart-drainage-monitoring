# Smart Drainage Monitoring and Flood Early Warning System

An IoT-based college project prototype designed to monitor drainage conditions and support early flood warnings using sensor data.

## Project Overview

The system combines an ESP32-C3 Super Mini, a web dashboard, a backend API, and a database to demonstrate drainage monitoring and risk alerts.

## Key Features

- Drainage water-level monitoring
- Rainfall and water-flow sensor integration
- Flood-risk and warning visualization
- Web-based monitoring dashboard
- Backend API and database integration
- Sensor simulator for testing without hardware
- Experimental MATLAB module

## Technology Stack

- **Hardware:** ESP32-C3 Super Mini, rain sensor, ultrasonic sensor, flow sensor
- **Frontend:** React
- **Backend:** Node.js and Express
- **Database:** MySQL
- **Additional tools:** MATLAB and sensor simulator

## Repository Structure

The complete project is in the [`smart-drainage-monitoring`](./smart-drainage-monitoring/) folder.

- `backend/` — API and server logic
- `frontend/` — web dashboard
- `database/` — database scripts
- `esp32/` — microcontroller firmware
- `simulator/` — simulated sensor data
- `matlab/` — experimental MATLAB module
- `docs/` — project documentation

## Getting Started

1. Review the documentation in `smart-drainage-monitoring/docs/`.
2. Configure the backend using the provided environment-variable example.
3. Set up the MySQL database using the supplied SQL scripts.
4. Install the frontend and backend dependencies.
5. Run the application locally following the project documentation.

**Security:** Do not commit real passwords, API keys, Wi-Fi credentials, or `.env` files.

## Project Status

College project prototype for learning and demonstration. Hardware integration and flood-risk predictions should be validated before any real-world safety use.

## Author

**YUVANESH-348**

[View the source code](https://github.com/YUVANESH-348/smart-drainage-monitoring)
