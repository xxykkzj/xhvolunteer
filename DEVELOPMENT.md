
**Author**: Manus AI  
**Version**: 1.0  
**Last Updated**: November 2025

---

## Executive Summary

The Temple Volunteer Management System is a comprehensive web application designed to manage volunteer services at Buddhist temples. The system implements a sophisticated **time bank** mechanism combined with a **seven-tier membership ranking system** (七地菩萨会员体系) based on cumulative service points. Volunteers earn points through service hours, which unlock rewards and privileges as they progress through seven spiritual levels inspired by the Bodhisattva grounds.

The application provides complete workflow management from volunteer enrollment through scheduling, attendance tracking, points accumulation, rank progression, and reward redemption. It supports both short-term volunteers and paid temple workers, with distinct handling for compensated versus volunteer service hours.

---

## System Architecture

### Technology Stack

The system is built on a modern full-stack TypeScript architecture that ensures type safety across the entire application stack.

**Frontend Technologies:**
- **React 19**: Latest React version with concurrent rendering capabilities
- **TypeScript 5.9**: Strict type checking throughout the application
- **Tailwind CSS 4**: Utility-first CSS framework with custom Buddhist-themed color palette
- **tRPC 11**: End-to-end type-safe API layer eliminating the need for manual API contracts
- **Wouter**: Lightweight client-side routing
- **shadcn/ui**: High-quality accessible component library built on Radix UI

**Backend Technologies:**
- **Node.js 22**: Latest LTS version with enhanced performance
- **Express 4**: Web application framework
- **tRPC 11**: Type-safe RPC framework replacing traditional REST APIs
- **Drizzle ORM**: Type-safe SQL query builder with excellent TypeScript integration
- **MySQL/TiDB**: Relational database for structured data storage

**Security & Infrastructure:**
- **AES-256-CBC**: Encryption for sensitive ID card data
- **HMAC-SHA256**: Digital signatures for redemption code verification
- **JWT**: Session management via signed cookies
- **Manus OAuth**: Integrated authentication system

### Database Schema

The system employs 18 interconnected tables organized into logical domains:

**User Management Domain:**
- `users`: Core user profiles with role-based access control (volunteer, leader, manager, admin, super-admin)
- `user_sensitive`: Encrypted sensitive data (ID cards) stored separately for security