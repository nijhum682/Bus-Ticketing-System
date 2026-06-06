-- Bus Ticketing System Database Setup
-- Run this in XAMPP phpMyAdmin (SQL tab)

DROP DATABASE IF EXISTS bus_ticketing;
CREATE DATABASE bus_ticketing;
USE bus_ticketing;

CREATE TABLE IF NOT EXISTS Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    PermanentDistrict VARCHAR(100) NOT NULL DEFAULT '',
    Gender VARCHAR(20) NOT NULL DEFAULT '',
    Profession VARCHAR(100) NOT NULL DEFAULT '',
    Role VARCHAR(50) NOT NULL DEFAULT 'User',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Notices (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    NoticeNumber VARCHAR(10) NOT NULL,
    Title VARCHAR(100) NOT NULL,
    Content TEXT NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default notices matching image details
INSERT INTO Notices (NoticeNumber, Title, Content) VALUES 
('01', 'Refund Policy', 'Eid tickets are non-cancellable, non-transferable, and non-refundable, except where a refund is approved under the applicable refund policy due to operator-cancelled trips.'),
('02', 'Eid Period', 'As per Bangladesh Bus Owners Association\'s declaration, the Eid trip period will be from 14 May 2026 to 13 June 2026.'),
('03', 'Operator Rights', 'Bus operators reserve the right to delay, cancel, reschedule, change bus type, change seats, change routes, or change boarding points due to unavoidable operational reasons.'),
('04', 'Reporting Time', 'Passengers must report to the correct boarding point at least 30 minutes before the scheduled departure time. Travello will not be responsible for missed trips, cancellation, rescheduling, or seat reassignment due to late reporting.'),
('05', 'Refund Processing', 'If a trip is cancelled by the bus operator and refund is approved, the refundable amount will be credited to the original payment method, bank card or MFS number used for the purchase, within a reasonable timeframe and subject to payment partner policies.');
