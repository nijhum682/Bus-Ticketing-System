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
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
