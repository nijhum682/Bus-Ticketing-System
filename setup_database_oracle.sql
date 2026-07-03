-- ================================================================
-- Travello Bus Ticketing System
-- Oracle PL/SQL Database Setup (Oracle 11g / 12c / 19c)
-- Includes: Tables, Sequences, Triggers, Functions, Procedures
-- ================================================================

ALTER SESSION SET CURRENT_SCHEMA = SYSTEM;

-- ================================================================
-- SECTION 1: DROP EXISTING OBJECTS (clean slate)
-- ================================================================

-- Drop stored procedures
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_CANCEL_BOOKING';       EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_REGISTER_USER';        EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_ADD_BOOKING';          EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_SEARCH_BUSES';         EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_GET_USER_BOOKINGS';    EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP PROCEDURE SP_GET_SUMMARY_REPORT';   EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Drop functions
BEGIN EXECUTE IMMEDIATE 'DROP FUNCTION FN_GET_AVAILABLE_SEATS';   EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP FUNCTION FN_COUNT_USER_BOOKINGS';   EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP FUNCTION FN_IS_JOURNEY_UPCOMING';   EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP FUNCTION FN_GET_BOOKING_STATUS';    EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP FUNCTION FN_GET_TOTAL_REVENUE';     EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Drop tables
BEGIN EXECUTE IMMEDIATE 'DROP TABLE "REVIEWS"  CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE "BOOKINGS" CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE "BUSES"    CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE "NOTICES"  CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE "USERS"    CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- Drop sequences
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE "USERS_SEQ"';    EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE "NOTICES_SEQ"';  EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE "BUSES_SEQ"';    EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE "BOOKINGS_SEQ"'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE "REVIEWS_SEQ"';  EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ================================================================
-- SECTION 2: CREATE SEQUENCES
-- Each table uses a dedicated sequence for primary key generation.
-- EF Core HiLo pattern reads from these sequences.
-- ================================================================

CREATE SEQUENCE "USERS_SEQ"    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE "NOTICES_SEQ"  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE "BUSES_SEQ"    START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE "BOOKINGS_SEQ" START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE "REVIEWS_SEQ"  START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- ================================================================
-- SECTION 3: CREATE TABLES
-- ================================================================

-- USERS: Stores registered passengers and admin accounts
CREATE TABLE "USERS" (
    "ID"                NUMBER        PRIMARY KEY,
    "NAME"              VARCHAR2(100) NOT NULL,
    "USERNAME"          VARCHAR2(50)  NOT NULL UNIQUE,
    "EMAIL"             VARCHAR2(100) NOT NULL UNIQUE,
    "PASSWORD"          VARCHAR2(255) NOT NULL,
    "PHONE"             VARCHAR2(20),
    "PERMANENTDISTRICT" VARCHAR2(100) DEFAULT NULL,
    "PRESAREA"          VARCHAR2(100) DEFAULT NULL,
    "PRESUPAZILLA"      VARCHAR2(100) DEFAULT NULL,
    "PRESDISTRICT"      VARCHAR2(100) DEFAULT NULL,
    "PRESDIVISION"      VARCHAR2(100) DEFAULT NULL,
    "PERMAREA"          VARCHAR2(100) DEFAULT NULL,
    "PERMUPAZILLA"      VARCHAR2(100) DEFAULT NULL,
    "PERMDIVISION"      VARCHAR2(100) DEFAULT NULL,
    "GENDER"            VARCHAR2(20)  DEFAULT NULL,
    "PROFESSION"        VARCHAR2(100) DEFAULT NULL,
    "ROLE"              VARCHAR2(50)  DEFAULT 'User' NOT NULL,
    "CREATEDAT"         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- NOTICES: Admin-published system notices shown on homepage
CREATE TABLE "NOTICES" (
    "ID"           NUMBER        PRIMARY KEY,
    "NOTICENUMBER" VARCHAR2(10)  NOT NULL,
    "TITLE"        VARCHAR2(100) NOT NULL,
    "CONTENT"      CLOB          NOT NULL,
    "CREATEDAT"    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- BUSES: Available bus services with seat and route info
CREATE TABLE "BUSES" (
    "ID"             NUMBER        PRIMARY KEY,
    "OPERATOR"       VARCHAR2(100) NOT NULL,
    "BUSTYPE"        VARCHAR2(50)  NOT NULL,
    "DEPARTURETIME"  VARCHAR2(50)  NOT NULL,
    "FARE"           NUMBER(10)    NOT NULL,
    "AVAILABLESEATS" NUMBER(10)    DEFAULT 40 NOT NULL,
    "FROMDISTRICT"   VARCHAR2(100) NOT NULL,
    "TODISTRICT"     VARCHAR2(100) NOT NULL,
    "JOURNEYDATE"    VARCHAR2(50)  DEFAULT NULL,
    "BOOKEDSEATS"    VARCHAR2(500) DEFAULT NULL
);

-- BOOKINGS: Ticket booking records per user per journey
CREATE TABLE "BOOKINGS" (
    "ID"                NUMBER        PRIMARY KEY,
    "USEREMAIL"         VARCHAR2(100) NOT NULL,
    "BUSID"             NUMBER(10)    NOT NULL,
    "BUSNAME"           VARCHAR2(100) NOT NULL,
    "FROMDISTRICT"      VARCHAR2(100) NOT NULL,
    "TODISTRICT"        VARCHAR2(100) NOT NULL,
    "JOURNEYDATE"       VARCHAR2(50)  NOT NULL,
    "SEATS"             VARCHAR2(100) NOT NULL,
    "PAYMENTMETHOD"     VARCHAR2(50)  NOT NULL,
    "TICKETISSUINGTIME" TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "DEPARTURETIME"     VARCHAR2(50)  DEFAULT NULL,
    "STATUS"            VARCHAR2(50)  DEFAULT 'Upcoming' NOT NULL
);

-- REVIEWS: Post-journey reviews submitted by passengers
CREATE TABLE "REVIEWS" (
    "ID"          NUMBER         PRIMARY KEY,
    "BOOKINGID"   NUMBER(10)     NOT NULL,
    "USEREMAIL"   VARCHAR2(100)  NOT NULL,
    "BUSOPERATOR" VARCHAR2(100)  NOT NULL,
    "ROUTE"       VARCHAR2(200)  NOT NULL,
    "JOURNEYDATE" VARCHAR2(50)   NOT NULL,
    "RATING"      NUMBER(10)     NOT NULL,
    "COMMENT"     VARCHAR2(1000) NOT NULL,
    "CREATEDAT"   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "FK_REVIEWS_BOOKING"
        FOREIGN KEY ("BOOKINGID") REFERENCES "BOOKINGS"("ID") ON DELETE CASCADE
);

-- Indexes for frequent query patterns
CREATE INDEX "IX_BUSES_FROMTO"      ON "BUSES"    ("FROMDISTRICT", "TODISTRICT");
CREATE INDEX "IX_BOOKINGS_EMAIL"    ON "BOOKINGS" ("USEREMAIL");
CREATE INDEX "IX_BOOKINGS_BUSID"    ON "BOOKINGS" ("BUSID");
CREATE INDEX "IX_REVIEWS_EMAIL"     ON "REVIEWS"  ("USEREMAIL");
CREATE INDEX "IX_REVIEWS_BOOKINGID" ON "REVIEWS"  ("BOOKINGID");

-- ================================================================
-- SECTION 4: AUTO-INCREMENT ID TRIGGERS
-- These triggers fire BEFORE INSERT on each table to automatically
-- assign the next sequence value as the primary key ID,
-- and set default timestamp fields when not supplied.
-- ================================================================

-- Trigger: Auto-assign ID and CREATEDAT for USERS
CREATE OR REPLACE TRIGGER "USERS_TRG"
BEFORE INSERT ON "USERS"
FOR EACH ROW
BEGIN
    IF :NEW."ID" IS NULL THEN
        SELECT "USERS_SEQ".NEXTVAL INTO :NEW."ID" FROM DUAL;
    END IF;
    IF :NEW."CREATEDAT" IS NULL THEN
        :NEW."CREATEDAT" := CURRENT_TIMESTAMP;
    END IF;
END;
/

-- Trigger: Auto-assign ID and CREATEDAT for NOTICES
CREATE OR REPLACE TRIGGER "NOTICES_TRG"
BEFORE INSERT ON "NOTICES"
FOR EACH ROW
BEGIN
    IF :NEW."ID" IS NULL THEN
        SELECT "NOTICES_SEQ".NEXTVAL INTO :NEW."ID" FROM DUAL;
    END IF;
    IF :NEW."CREATEDAT" IS NULL THEN
        :NEW."CREATEDAT" := CURRENT_TIMESTAMP;
    END IF;
END;
/

-- Trigger: Auto-assign ID and default AVAILABLESEATS for BUSES
CREATE OR REPLACE TRIGGER "BUSES_TRG"
BEFORE INSERT ON "BUSES"
FOR EACH ROW
BEGIN
    IF :NEW."ID" IS NULL THEN
        SELECT "BUSES_SEQ".NEXTVAL INTO :NEW."ID" FROM DUAL;
    END IF;
    IF :NEW."AVAILABLESEATS" IS NULL THEN
        :NEW."AVAILABLESEATS" := 40;
    END IF;
END;
/

-- Trigger: Auto-assign ID, TICKETISSUINGTIME, and default STATUS for BOOKINGS
CREATE OR REPLACE TRIGGER "BOOKINGS_TRG"
BEFORE INSERT ON "BOOKINGS"
FOR EACH ROW
BEGIN
    IF :NEW."ID" IS NULL THEN
        SELECT "BOOKINGS_SEQ".NEXTVAL INTO :NEW."ID" FROM DUAL;
    END IF;
    IF :NEW."TICKETISSUINGTIME" IS NULL THEN
        :NEW."TICKETISSUINGTIME" := CURRENT_TIMESTAMP;
    END IF;
    IF :NEW."STATUS" IS NULL THEN
        :NEW."STATUS" := 'Upcoming';
    END IF;
END;
/

-- Trigger: Auto-assign ID and CREATEDAT for REVIEWS
CREATE OR REPLACE TRIGGER "REVIEWS_TRG"
BEFORE INSERT ON "REVIEWS"
FOR EACH ROW
BEGIN
    IF :NEW."ID" IS NULL THEN
        SELECT "REVIEWS_SEQ".NEXTVAL INTO :NEW."ID" FROM DUAL;
    END IF;
    IF :NEW."CREATEDAT" IS NULL THEN
        :NEW."CREATEDAT" := CURRENT_TIMESTAMP;
    END IF;
END;
/

-- ================================================================
-- SECTION 5: BUSINESS LOGIC TRIGGERS
-- These triggers enforce data integrity rules at the database
-- level, independent of the application layer.
-- ================================================================

-- Trigger: Validate user ROLE must be 'Admin' or 'User'
-- Prevents invalid roles from being inserted or updated.
CREATE OR REPLACE TRIGGER "USERS_ROLE_VALIDATE_TRG"
BEFORE INSERT OR UPDATE OF "ROLE" ON "USERS"
FOR EACH ROW
BEGIN
    IF :NEW."ROLE" NOT IN ('Admin', 'User') THEN
        RAISE_APPLICATION_ERROR(
            -20001,
            'Invalid role: "' || :NEW."ROLE" || '". Must be Admin or User.'
        );
    END IF;
END;
/

-- Trigger: Validate booking STATUS on insert or update
-- Ensures STATUS is always one of the three allowed values.
CREATE OR REPLACE TRIGGER "BOOKINGS_STATUS_VALIDATE_TRG"
BEFORE INSERT OR UPDATE OF "STATUS" ON "BOOKINGS"
FOR EACH ROW
BEGIN
    IF :NEW."STATUS" NOT IN ('Upcoming', 'Completed', 'Cancelled') THEN
        RAISE_APPLICATION_ERROR(
            -20002,
            'Invalid booking status: "' || :NEW."STATUS" || '". Must be Upcoming, Completed, or Cancelled.'
        );
    END IF;
END;
/

-- Trigger: Validate review RATING (1-5) and non-empty COMMENT
-- Protects review data quality at the database level.
CREATE OR REPLACE TRIGGER "REVIEWS_VALIDATE_TRG"
BEFORE INSERT OR UPDATE ON "REVIEWS"
FOR EACH ROW
BEGIN
    IF :NEW."RATING" < 1 OR :NEW."RATING" > 5 THEN
        RAISE_APPLICATION_ERROR(
            -20003,
            'Rating must be between 1 and 5. Received: ' || :NEW."RATING"
        );
    END IF;
    IF TRIM(:NEW."COMMENT") IS NULL OR LENGTH(TRIM(:NEW."COMMENT")) = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20004,
            'Review comment cannot be empty.'
        );
    END IF;
END;
/

-- ================================================================
-- SECTION 6: FUNCTIONS
-- Reusable PL/SQL functions for querying and computing values
-- used by both stored procedures and direct SQL queries.
-- ================================================================

-- Function: FN_GET_AVAILABLE_SEATS
-- Returns the current available seat count for a given bus ID.
-- Returns -1 if the bus does not exist.
CREATE OR REPLACE FUNCTION FN_GET_AVAILABLE_SEATS(
    p_bus_id IN NUMBER
) RETURN NUMBER IS
    v_seats NUMBER;
BEGIN
    SELECT "AVAILABLESEATS"
    INTO   v_seats
    FROM   "BUSES"
    WHERE  "ID" = p_bus_id;

    RETURN v_seats;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN -1;
    WHEN OTHERS        THEN RETURN -1;
END FN_GET_AVAILABLE_SEATS;
/

-- Function: FN_COUNT_USER_BOOKINGS
-- Returns the total number of bookings (all statuses) for a user.
CREATE OR REPLACE FUNCTION FN_COUNT_USER_BOOKINGS(
    p_email IN VARCHAR2
) RETURN NUMBER IS
    v_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO   v_count
    FROM   "BOOKINGS"
    WHERE  LOWER("USEREMAIL") = LOWER(p_email);

    RETURN NVL(v_count, 0);
EXCEPTION
    WHEN OTHERS THEN RETURN 0;
END FN_COUNT_USER_BOOKINGS;
/

-- Function: FN_IS_JOURNEY_UPCOMING
-- Checks whether a journey is still in the future.
-- Journey date format: 'DD/MM/YY', Departure time: 'HH:MI AM/PM'
-- Returns: 'YES', 'NO', or 'UNKNOWN' (if date cannot be parsed).
CREATE OR REPLACE FUNCTION FN_IS_JOURNEY_UPCOMING(
    p_journey_date   IN VARCHAR2,
    p_departure_time IN VARCHAR2
) RETURN VARCHAR2 IS
    v_journey_dt DATE;
BEGIN
    v_journey_dt := TO_DATE(
        p_journey_date || ' ' || p_departure_time,
        'DD/MM/YY HH:MI AM'
    );

    IF v_journey_dt > SYSDATE THEN
        RETURN 'YES';
    ELSE
        RETURN 'NO';
    END IF;
EXCEPTION
    WHEN OTHERS THEN RETURN 'UNKNOWN';
END FN_IS_JOURNEY_UPCOMING;
/

-- Function: FN_GET_BOOKING_STATUS
-- Computes the real-time status of a booking:
--   Cancelled  -> returns 'Cancelled'
--   Past date  -> returns 'Completed'
--   Future date -> returns 'Upcoming'
CREATE OR REPLACE FUNCTION FN_GET_BOOKING_STATUS(
    p_booking_id IN NUMBER
) RETURN VARCHAR2 IS
    v_status       VARCHAR2(50);
    v_journey_date VARCHAR2(50);
    v_depart_time  VARCHAR2(50);
    v_journey_dt   DATE;
BEGIN
    SELECT "STATUS", "JOURNEYDATE", "DEPARTURETIME"
    INTO   v_status, v_journey_date, v_depart_time
    FROM   "BOOKINGS"
    WHERE  "ID" = p_booking_id;

    -- Cancelled is terminal — no override
    IF v_status = 'Cancelled' THEN
        RETURN 'Cancelled';
    END IF;

    -- Parse journey datetime and compare to now
    BEGIN
        v_journey_dt := TO_DATE(
            v_journey_date || ' ' || v_depart_time,
            'DD/MM/YY HH:MI AM'
        );
        IF v_journey_dt <= SYSDATE THEN
            RETURN 'Completed';
        ELSE
            RETURN 'Upcoming';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN RETURN 'Upcoming'; -- Default if date parse fails
    END;
EXCEPTION
    WHEN NO_DATA_FOUND THEN RETURN 'NOT FOUND';
    WHEN OTHERS        THEN RETURN 'ERROR';
END FN_GET_BOOKING_STATUS;
/

-- Function: FN_GET_TOTAL_REVENUE
-- Returns the total fare collected from all non-cancelled bookings.
-- Joins BOOKINGS with BUSES to get per-booking fare.
CREATE OR REPLACE FUNCTION FN_GET_TOTAL_REVENUE
RETURN NUMBER IS
    v_total NUMBER := 0;
BEGIN
    SELECT NVL(SUM(bs."FARE"), 0)
    INTO   v_total
    FROM   "BOOKINGS" bk
    JOIN   "BUSES"    bs ON bs."ID" = bk."BUSID"
    WHERE  bk."STATUS" != 'Cancelled';

    RETURN v_total;
EXCEPTION
    WHEN OTHERS THEN RETURN 0;
END FN_GET_TOTAL_REVENUE;
/

-- ================================================================
-- SECTION 7: STORED PROCEDURES
-- Encapsulate complex business operations as reusable procedures.
-- ================================================================

-- Procedure: SP_CANCEL_BOOKING
-- Cancels a booking by ID and restores the bus available seats.
-- Enforces:
--   1. Booking must exist and not already be cancelled
--   2. Journey must not have already departed
--   3. Cancellation must be at least 12 hours before departure
-- OUT p_result: 'SUCCESS: ...' or 'ERROR: ...'
CREATE OR REPLACE PROCEDURE SP_CANCEL_BOOKING(
    p_booking_id IN  NUMBER,
    p_result     OUT VARCHAR2
) IS
    v_status       VARCHAR2(50);
    v_bus_id       NUMBER;
    v_seats        VARCHAR2(100);
    v_journey_date VARCHAR2(50);
    v_depart_time  VARCHAR2(50);
    v_journey_dt   DATE;
    v_seat_count   NUMBER;
BEGIN
    -- Fetch booking details
    SELECT "STATUS", "BUSID", "SEATS", "JOURNEYDATE", "DEPARTURETIME"
    INTO   v_status, v_bus_id, v_seats, v_journey_date, v_depart_time
    FROM   "BOOKINGS"
    WHERE  "ID" = p_booking_id;

    -- Check: already cancelled?
    IF v_status = 'Cancelled' THEN
        p_result := 'ERROR: This booking is already cancelled.';
        RETURN;
    END IF;

    -- Check: journey date/time constraints
    BEGIN
        v_journey_dt := TO_DATE(
            v_journey_date || ' ' || v_depart_time,
            'DD/MM/YY HH:MI AM'
        );

        IF v_journey_dt <= SYSDATE THEN
            p_result := 'ERROR: Cannot cancel — the journey has already departed or completed.';
            RETURN;
        END IF;

        IF (v_journey_dt - SYSDATE) * 24 < 12 THEN
            p_result := 'ERROR: Cancellation must be made at least 12 hours before departure.';
            RETURN;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN NULL; -- Skip time check if date parse fails
    END;

    -- Count seats being freed (comma-separated list)
    v_seat_count := LENGTH(v_seats) - LENGTH(REPLACE(v_seats, ',', '')) + 1;

    -- Mark booking as Cancelled
    UPDATE "BOOKINGS"
    SET    "STATUS" = 'Cancelled'
    WHERE  "ID"     = p_booking_id;

    -- Restore available seat count on the bus (max 40)
    UPDATE "BUSES"
    SET    "AVAILABLESEATS" = LEAST(40, "AVAILABLESEATS" + v_seat_count)
    WHERE  "ID" = v_bus_id;

    COMMIT;
    p_result := 'SUCCESS: Booking #' || p_booking_id || ' cancelled. '
                || v_seat_count || ' seat(s) restored on Bus ID ' || v_bus_id || '.';
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_result := 'ERROR: Booking #' || p_booking_id || ' not found.';
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END SP_CANCEL_BOOKING;
/

-- Procedure: SP_REGISTER_USER
-- Registers a new user after checking for duplicate email/username.
-- OUT p_result: 'SUCCESS: ...' or 'ERROR: ...'
CREATE OR REPLACE PROCEDURE SP_REGISTER_USER(
    p_name     IN  VARCHAR2,
    p_username IN  VARCHAR2,
    p_email    IN  VARCHAR2,
    p_password IN  VARCHAR2,
    p_phone    IN  VARCHAR2,
    p_role     IN  VARCHAR2 DEFAULT 'User',
    p_result   OUT VARCHAR2
) IS
    v_count NUMBER;
BEGIN
    -- Duplicate email check
    SELECT COUNT(*) INTO v_count FROM "USERS"
    WHERE  LOWER("EMAIL") = LOWER(p_email);
    IF v_count > 0 THEN
        p_result := 'ERROR: Email address is already registered.';
        RETURN;
    END IF;

    -- Duplicate username check
    SELECT COUNT(*) INTO v_count FROM "USERS"
    WHERE  LOWER("USERNAME") = LOWER(p_username);
    IF v_count > 0 THEN
        p_result := 'ERROR: Username is already taken.';
        RETURN;
    END IF;

    -- Insert new user (USERS_TRG handles ID and CREATEDAT)
    INSERT INTO "USERS" (
        "NAME", "USERNAME", "EMAIL", "PASSWORD", "PHONE", "ROLE"
    ) VALUES (
        p_name, p_username, p_email, p_password, p_phone, p_role
    );

    COMMIT;
    p_result := 'SUCCESS: User "' || p_username || '" registered successfully.';
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END SP_REGISTER_USER;
/

-- Procedure: SP_ADD_BOOKING
-- Creates a new ticket booking after validating seat availability.
-- OUT p_result: 'SUCCESS: ...' or 'ERROR: ...'
CREATE OR REPLACE PROCEDURE SP_ADD_BOOKING(
    p_user_email    IN  VARCHAR2,
    p_bus_id        IN  NUMBER,
    p_bus_name      IN  VARCHAR2,
    p_from_district IN  VARCHAR2,
    p_to_district   IN  VARCHAR2,
    p_journey_date  IN  VARCHAR2,
    p_seats         IN  VARCHAR2,
    p_payment       IN  VARCHAR2,
    p_depart_time   IN  VARCHAR2,
    p_result        OUT VARCHAR2
) IS
    v_available  NUMBER;
    v_seat_count NUMBER;
BEGIN
    -- Check seat availability using the function
    v_available := FN_GET_AVAILABLE_SEATS(p_bus_id);

    IF v_available = -1 THEN
        p_result := 'ERROR: Bus ID ' || p_bus_id || ' not found.';
        RETURN;
    END IF;

    v_seat_count := LENGTH(p_seats) - LENGTH(REPLACE(p_seats, ',', '')) + 1;

    IF v_available < v_seat_count THEN
        p_result := 'ERROR: Not enough seats. Requested: ' || v_seat_count
                    || ', Available: ' || v_available || '.';
        RETURN;
    END IF;

    -- Insert booking (BOOKINGS_TRG handles ID, TICKETISSUINGTIME, STATUS)
    INSERT INTO "BOOKINGS" (
        "USEREMAIL", "BUSID", "BUSNAME",
        "FROMDISTRICT", "TODISTRICT",
        "JOURNEYDATE", "SEATS",
        "PAYMENTMETHOD", "DEPARTURETIME"
    ) VALUES (
        p_user_email, p_bus_id, p_bus_name,
        p_from_district, p_to_district,
        p_journey_date, p_seats,
        p_payment, p_depart_time
    );

    -- Decrease available seats on the bus
    UPDATE "BUSES"
    SET    "AVAILABLESEATS" = "AVAILABLESEATS" - v_seat_count
    WHERE  "ID" = p_bus_id;

    COMMIT;
    p_result := 'SUCCESS: Booking created for ' || v_seat_count
                || ' seat(s) on ' || p_bus_name || '.';
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_result := 'ERROR: ' || SQLERRM;
END SP_ADD_BOOKING;
/

-- Procedure: SP_SEARCH_BUSES
-- Returns a result cursor of available buses matching the given
-- origin, destination, and journey date.
-- OUT p_cursor: SYS_REFCURSOR with matching bus rows
CREATE OR REPLACE PROCEDURE SP_SEARCH_BUSES(
    p_from_district IN  VARCHAR2,
    p_to_district   IN  VARCHAR2,
    p_journey_date  IN  VARCHAR2,
    p_cursor        OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN p_cursor FOR
        SELECT "ID", "OPERATOR", "BUSTYPE", "DEPARTURETIME",
               "FARE", "AVAILABLESEATS",
               "FROMDISTRICT", "TODISTRICT",
               "JOURNEYDATE", "BOOKEDSEATS"
        FROM   "BUSES"
        WHERE  LOWER("FROMDISTRICT") = LOWER(p_from_district)
          AND  LOWER("TODISTRICT")   = LOWER(p_to_district)
          AND  "JOURNEYDATE"         = p_journey_date
          AND  "AVAILABLESEATS"      > 0
        ORDER  BY "DEPARTURETIME";
EXCEPTION
    WHEN OTHERS THEN
        -- Return empty result on error
        OPEN p_cursor FOR SELECT * FROM "BUSES" WHERE 1 = 0;
END SP_SEARCH_BUSES;
/

-- Procedure: SP_GET_USER_BOOKINGS
-- Returns all bookings for a user, ordered by most recent first.
-- OUT p_cursor: SYS_REFCURSOR with booking rows for the user
CREATE OR REPLACE PROCEDURE SP_GET_USER_BOOKINGS(
    p_email  IN  VARCHAR2,
    p_cursor OUT SYS_REFCURSOR
) IS
BEGIN
    OPEN p_cursor FOR
        SELECT bk."ID",
               bk."BUSNAME",
               bk."FROMDISTRICT",
               bk."TODISTRICT",
               bk."JOURNEYDATE",
               bk."DEPARTURETIME",
               bk."SEATS",
               bk."PAYMENTMETHOD",
               bk."TICKETISSUINGTIME",
               FN_GET_BOOKING_STATUS(bk."ID") AS "COMPUTED_STATUS"
        FROM   "BOOKINGS" bk
        WHERE  LOWER(bk."USEREMAIL") = LOWER(p_email)
        ORDER  BY bk."TICKETISSUINGTIME" DESC;
EXCEPTION
    WHEN OTHERS THEN
        OPEN p_cursor FOR SELECT * FROM "BOOKINGS" WHERE 1 = 0;
END SP_GET_USER_BOOKINGS;
/

-- Procedure: SP_GET_SUMMARY_REPORT
-- Provides a full admin dashboard summary in a single call:
-- total users, admins, buses, bookings by status, and revenue.
CREATE OR REPLACE PROCEDURE SP_GET_SUMMARY_REPORT(
    p_total_users    OUT NUMBER,
    p_total_admins   OUT NUMBER,
    p_total_buses    OUT NUMBER,
    p_total_bookings OUT NUMBER,
    p_upcoming       OUT NUMBER,
    p_completed      OUT NUMBER,
    p_cancelled      OUT NUMBER,
    p_total_revenue  OUT NUMBER
) IS
BEGIN
    SELECT COUNT(*) INTO p_total_users   FROM "USERS"    WHERE "ROLE" = 'User';
    SELECT COUNT(*) INTO p_total_admins  FROM "USERS"    WHERE "ROLE" = 'Admin';
    SELECT COUNT(*) INTO p_total_buses   FROM "BUSES";
    SELECT COUNT(*) INTO p_total_bookings FROM "BOOKINGS";
    SELECT COUNT(*) INTO p_upcoming      FROM "BOOKINGS" WHERE "STATUS" = 'Upcoming';
    SELECT COUNT(*) INTO p_completed     FROM "BOOKINGS" WHERE "STATUS" = 'Completed';
    SELECT COUNT(*) INTO p_cancelled     FROM "BOOKINGS" WHERE "STATUS" = 'Cancelled';
    p_total_revenue := FN_GET_TOTAL_REVENUE();
EXCEPTION
    WHEN OTHERS THEN
        p_total_users := 0;  p_total_admins  := 0;
        p_total_buses := 0;  p_total_bookings := 0;
        p_upcoming    := 0;  p_completed     := 0;
        p_cancelled   := 0;  p_total_revenue := 0;
END SP_GET_SUMMARY_REPORT;
/

-- ================================================================
-- SECTION 8: SEED DEFAULT NOTICES
-- ================================================================

INSERT INTO "NOTICES" ("NOTICENUMBER", "TITLE", "CONTENT") VALUES
('01', 'Refund Policy',
 'Eid tickets are non-cancellable, non-transferable, and non-refundable, except where a refund is approved under the applicable refund policy due to operator-cancelled trips.');

INSERT INTO "NOTICES" ("NOTICENUMBER", "TITLE", "CONTENT") VALUES
('02', 'Eid Period',
 'As per Bangladesh Bus Owners Association''s declaration, the Eid trip period will be from 14 May 2026 to 13 June 2026.');

INSERT INTO "NOTICES" ("NOTICENUMBER", "TITLE", "CONTENT") VALUES
('03', 'Operator Rights',
 'Bus operators reserve the right to delay, cancel, reschedule, change bus type, change seats, change routes, or change boarding points due to unavoidable operational reasons.');

INSERT INTO "NOTICES" ("NOTICENUMBER", "TITLE", "CONTENT") VALUES
('04', 'Reporting Time',
 'Passengers must report to the correct boarding point at least 30 minutes before the scheduled departure time. Travello will not be responsible for missed trips, cancellation, rescheduling, or seat reassignment due to late reporting.');

INSERT INTO "NOTICES" ("NOTICENUMBER", "TITLE", "CONTENT") VALUES
('05', 'Refund Processing',
 'If a trip is cancelled by the bus operator and refund is approved, the refundable amount will be credited to the original payment method, bank card or MFS number used for the purchase, within a reasonable timeframe and subject to payment partner policies.');

COMMIT;

-- ================================================================
-- QUICK REFERENCE: HOW TO USE THE PL/SQL OBJECTS
-- ================================================================
--
-- FUNCTIONS (call in SELECT or PL/SQL):
--   SELECT FN_GET_AVAILABLE_SEATS(101) FROM DUAL;
--   SELECT FN_COUNT_USER_BOOKINGS('user@email.com') FROM DUAL;
--   SELECT FN_IS_JOURNEY_UPCOMING('15/06/26','07:30 AM') FROM DUAL;
--   SELECT FN_GET_BOOKING_STATUS(5) FROM DUAL;
--   SELECT FN_GET_TOTAL_REVENUE() FROM DUAL;
--
-- STORED PROCEDURES (call with EXEC or in PL/SQL blocks):
--   DECLARE v_result VARCHAR2(300);
--   BEGIN SP_CANCEL_BOOKING(5, v_result); DBMS_OUTPUT.PUT_LINE(v_result); END;
--
--   DECLARE v_result VARCHAR2(300);
--   BEGIN SP_REGISTER_USER('John','john99','j@mail.com','Pass#123','01700000000','User',v_result);
--         DBMS_OUTPUT.PUT_LINE(v_result); END;
--
--   DECLARE v_cur SYS_REFCURSOR;
--   BEGIN SP_SEARCH_BUSES('Dhaka','Chittagong','15/07/26', v_cur); END;
--
--   DECLARE
--     u NUMBER; ad NUMBER; b NUMBER; bk NUMBER; up NUMBER; co NUMBER; ca NUMBER; rev NUMBER;
--   BEGIN
--     SP_GET_SUMMARY_REPORT(u,ad,b,bk,up,co,ca,rev);
--     DBMS_OUTPUT.PUT_LINE('Users:'||u||' Buses:'||b||' Revenue:'||rev);
--   END;
-- ================================================================

-- ================================================================
-- SECTION 9: PACKAGE — PKG_BUS_TICKETING
-- A Package bundles all related functions and procedures into a
-- single named unit. It has two parts:
--   1. Package Specification — the public interface (what is visible)
--   2. Package Body          — the implementation (how it works)
-- Call via: PKG_BUS_TICKETING.function_or_procedure_name(...)
-- ================================================================

-- Drop existing package first (clean slate)
BEGIN EXECUTE IMMEDIATE 'DROP PACKAGE PKG_BUS_TICKETING'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ================================================================
-- PACKAGE SPECIFICATION
-- Declares all public constants, types, functions, and procedures.
-- This is the "interface" — what callers can use.
-- ================================================================
CREATE OR REPLACE PACKAGE PKG_BUS_TICKETING AS

    -- Package-level constants
    C_MAX_SEATS          CONSTANT NUMBER       := 40;
    C_MIN_CANCEL_HOURS   CONSTANT NUMBER       := 12;
    C_DEFAULT_ROLE       CONSTANT VARCHAR2(10) := 'User';
    C_STATUS_UPCOMING    CONSTANT VARCHAR2(20) := 'Upcoming';
    C_STATUS_COMPLETED   CONSTANT VARCHAR2(20) := 'Completed';
    C_STATUS_CANCELLED   CONSTANT VARCHAR2(20) := 'Cancelled';

    -- Custom type: booking summary record
    TYPE t_booking_summary IS RECORD (
        booking_id      NUMBER,
        bus_name        VARCHAR2(100),
        from_district   VARCHAR2(100),
        to_district     VARCHAR2(100),
        journey_date    VARCHAR2(50),
        seats           VARCHAR2(100),
        status          VARCHAR2(50)
    );

    -- -------------------------------------------------------
    -- FUNCTION DECLARATIONS
    -- -------------------------------------------------------

    -- Returns available seat count for a bus (-1 if not found)
    FUNCTION FN_GET_AVAILABLE_SEATS(
        p_bus_id IN NUMBER
    ) RETURN NUMBER;

    -- Returns total booking count for a user email
    FUNCTION FN_COUNT_USER_BOOKINGS(
        p_email IN VARCHAR2
    ) RETURN NUMBER;

    -- Returns 'YES', 'NO', or 'UNKNOWN' for journey time check
    FUNCTION FN_IS_JOURNEY_UPCOMING(
        p_journey_date   IN VARCHAR2,
        p_departure_time IN VARCHAR2
    ) RETURN VARCHAR2;

    -- Returns computed real-time status of a booking
    FUNCTION FN_GET_BOOKING_STATUS(
        p_booking_id IN NUMBER
    ) RETURN VARCHAR2;

    -- Returns total revenue from all non-cancelled bookings
    FUNCTION FN_GET_TOTAL_REVENUE
    RETURN NUMBER;

    -- -------------------------------------------------------
    -- PROCEDURE DECLARATIONS
    -- -------------------------------------------------------

    -- Cancel a booking and restore bus seats
    PROCEDURE SP_CANCEL_BOOKING(
        p_booking_id IN  NUMBER,
        p_result     OUT VARCHAR2
    );

    -- Register a new user with duplicate checks
    PROCEDURE SP_REGISTER_USER(
        p_name     IN  VARCHAR2,
        p_username IN  VARCHAR2,
        p_email    IN  VARCHAR2,
        p_password IN  VARCHAR2,
        p_phone    IN  VARCHAR2,
        p_role     IN  VARCHAR2 DEFAULT 'User',
        p_result   OUT VARCHAR2
    );

    -- Create a booking with seat availability validation
    PROCEDURE SP_ADD_BOOKING(
        p_user_email    IN  VARCHAR2,
        p_bus_id        IN  NUMBER,
        p_bus_name      IN  VARCHAR2,
        p_from_district IN  VARCHAR2,
        p_to_district   IN  VARCHAR2,
        p_journey_date  IN  VARCHAR2,
        p_seats         IN  VARCHAR2,
        p_payment       IN  VARCHAR2,
        p_depart_time   IN  VARCHAR2,
        p_result        OUT VARCHAR2
    );

    -- Search available buses by route and date
    PROCEDURE SP_SEARCH_BUSES(
        p_from_district IN  VARCHAR2,
        p_to_district   IN  VARCHAR2,
        p_journey_date  IN  VARCHAR2,
        p_cursor        OUT SYS_REFCURSOR
    );

    -- Get all bookings for a user (with computed status)
    PROCEDURE SP_GET_USER_BOOKINGS(
        p_email  IN  VARCHAR2,
        p_cursor OUT SYS_REFCURSOR
    );

    -- Get full admin summary report in one call
    PROCEDURE SP_GET_SUMMARY_REPORT(
        p_total_users    OUT NUMBER,
        p_total_admins   OUT NUMBER,
        p_total_buses    OUT NUMBER,
        p_total_bookings OUT NUMBER,
        p_upcoming       OUT NUMBER,
        p_completed      OUT NUMBER,
        p_cancelled      OUT NUMBER,
        p_total_revenue  OUT NUMBER
    );

END PKG_BUS_TICKETING;
/

-- ================================================================
-- PACKAGE BODY
-- Full implementation of every function and procedure declared
-- in the package specification above.
-- ================================================================
CREATE OR REPLACE PACKAGE BODY PKG_BUS_TICKETING AS

    -- -------------------------------------------------------
    -- PRIVATE HELPER: Count seats in comma-separated string
    -- e.g. 'A1, B2, C3' -> returns 3
    -- -------------------------------------------------------
    FUNCTION count_seats(p_seats IN VARCHAR2) RETURN NUMBER IS
    BEGIN
        RETURN LENGTH(p_seats) - LENGTH(REPLACE(p_seats, ',', '')) + 1;
    END count_seats;

    -- -------------------------------------------------------
    -- PRIVATE HELPER: Parse journey datetime string to DATE
    -- Format: journey_date='DD/MM/YY', time='HH:MI AM'
    -- Returns NULL if parsing fails
    -- -------------------------------------------------------
    FUNCTION parse_journey_dt(
        p_journey_date   IN VARCHAR2,
        p_departure_time IN VARCHAR2
    ) RETURN DATE IS
        v_dt DATE;
    BEGIN
        v_dt := TO_DATE(
            p_journey_date || ' ' || p_departure_time,
            'DD/MM/YY HH:MI AM'
        );
        RETURN v_dt;
    EXCEPTION
        WHEN OTHERS THEN RETURN NULL;
    END parse_journey_dt;

    -- -------------------------------------------------------
    -- FUNCTION IMPLEMENTATIONS
    -- -------------------------------------------------------

    FUNCTION FN_GET_AVAILABLE_SEATS(p_bus_id IN NUMBER) RETURN NUMBER IS
        v_seats NUMBER;
    BEGIN
        SELECT "AVAILABLESEATS" INTO v_seats
        FROM   "BUSES" WHERE "ID" = p_bus_id;
        RETURN v_seats;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN RETURN -1;
        WHEN OTHERS        THEN RETURN -1;
    END FN_GET_AVAILABLE_SEATS;

    FUNCTION FN_COUNT_USER_BOOKINGS(p_email IN VARCHAR2) RETURN NUMBER IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count
        FROM   "BOOKINGS"
        WHERE  LOWER("USEREMAIL") = LOWER(p_email);
        RETURN NVL(v_count, 0);
    EXCEPTION
        WHEN OTHERS THEN RETURN 0;
    END FN_COUNT_USER_BOOKINGS;

    FUNCTION FN_IS_JOURNEY_UPCOMING(
        p_journey_date   IN VARCHAR2,
        p_departure_time IN VARCHAR2
    ) RETURN VARCHAR2 IS
        v_dt DATE;
    BEGIN
        v_dt := parse_journey_dt(p_journey_date, p_departure_time);
        IF v_dt IS NULL THEN RETURN 'UNKNOWN'; END IF;
        IF v_dt > SYSDATE THEN RETURN 'YES'; ELSE RETURN 'NO'; END IF;
    END FN_IS_JOURNEY_UPCOMING;

    FUNCTION FN_GET_BOOKING_STATUS(p_booking_id IN NUMBER) RETURN VARCHAR2 IS
        v_status VARCHAR2(50);
        v_jdate  VARCHAR2(50);
        v_dtime  VARCHAR2(50);
        v_dt     DATE;
    BEGIN
        SELECT "STATUS", "JOURNEYDATE", "DEPARTURETIME"
        INTO   v_status, v_jdate, v_dtime
        FROM   "BOOKINGS" WHERE "ID" = p_booking_id;

        IF v_status = C_STATUS_CANCELLED THEN
            RETURN C_STATUS_CANCELLED;
        END IF;

        v_dt := parse_journey_dt(v_jdate, v_dtime);
        IF v_dt IS NULL THEN
            RETURN C_STATUS_UPCOMING;
        ELSIF v_dt <= SYSDATE THEN
            RETURN C_STATUS_COMPLETED;
        ELSE
            RETURN C_STATUS_UPCOMING;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN RETURN 'NOT FOUND';
        WHEN OTHERS        THEN RETURN 'ERROR';
    END FN_GET_BOOKING_STATUS;

    FUNCTION FN_GET_TOTAL_REVENUE RETURN NUMBER IS
        v_total NUMBER := 0;
    BEGIN
        SELECT NVL(SUM(bs."FARE"), 0) INTO v_total
        FROM   "BOOKINGS" bk
        JOIN   "BUSES"    bs ON bs."ID" = bk."BUSID"
        WHERE  bk."STATUS" != C_STATUS_CANCELLED;
        RETURN v_total;
    EXCEPTION
        WHEN OTHERS THEN RETURN 0;
    END FN_GET_TOTAL_REVENUE;

    -- -------------------------------------------------------
    -- PROCEDURE IMPLEMENTATIONS
    -- -------------------------------------------------------

    PROCEDURE SP_CANCEL_BOOKING(
        p_booking_id IN  NUMBER,
        p_result     OUT VARCHAR2
    ) IS
        v_status VARCHAR2(50);
        v_bus_id NUMBER;
        v_seats  VARCHAR2(100);
        v_jdate  VARCHAR2(50);
        v_dtime  VARCHAR2(50);
        v_dt     DATE;
        v_cnt    NUMBER;
    BEGIN
        SELECT "STATUS", "BUSID", "SEATS", "JOURNEYDATE", "DEPARTURETIME"
        INTO   v_status, v_bus_id, v_seats, v_jdate, v_dtime
        FROM   "BOOKINGS" WHERE "ID" = p_booking_id;

        IF v_status = C_STATUS_CANCELLED THEN
            p_result := 'ERROR: Booking is already cancelled.'; RETURN;
        END IF;

        v_dt := parse_journey_dt(v_jdate, v_dtime);
        IF v_dt IS NOT NULL THEN
            IF v_dt <= SYSDATE THEN
                p_result := 'ERROR: Cannot cancel a completed journey.'; RETURN;
            END IF;
            IF (v_dt - SYSDATE) * 24 < C_MIN_CANCEL_HOURS THEN
                p_result := 'ERROR: Must cancel at least '
                            || C_MIN_CANCEL_HOURS || ' hours before departure.';
                RETURN;
            END IF;
        END IF;

        v_cnt := count_seats(v_seats);

        UPDATE "BOOKINGS" SET "STATUS" = C_STATUS_CANCELLED WHERE "ID" = p_booking_id;
        UPDATE "BUSES"
        SET    "AVAILABLESEATS" = LEAST(C_MAX_SEATS, "AVAILABLESEATS" + v_cnt)
        WHERE  "ID" = v_bus_id;

        COMMIT;
        p_result := 'SUCCESS: Booking #' || p_booking_id || ' cancelled. '
                    || v_cnt || ' seat(s) restored on Bus ID ' || v_bus_id || '.';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN p_result := 'ERROR: Booking #' || p_booking_id || ' not found.';
        WHEN OTHERS        THEN ROLLBACK; p_result := 'ERROR: ' || SQLERRM;
    END SP_CANCEL_BOOKING;

    PROCEDURE SP_REGISTER_USER(
        p_name     IN  VARCHAR2,
        p_username IN  VARCHAR2,
        p_email    IN  VARCHAR2,
        p_password IN  VARCHAR2,
        p_phone    IN  VARCHAR2,
        p_role     IN  VARCHAR2 DEFAULT 'User',
        p_result   OUT VARCHAR2
    ) IS
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM "USERS"
        WHERE  LOWER("EMAIL") = LOWER(p_email);
        IF v_count > 0 THEN
            p_result := 'ERROR: Email already registered.'; RETURN;
        END IF;

        SELECT COUNT(*) INTO v_count FROM "USERS"
        WHERE  LOWER("USERNAME") = LOWER(p_username);
        IF v_count > 0 THEN
            p_result := 'ERROR: Username already taken.'; RETURN;
        END IF;

        INSERT INTO "USERS" ("NAME","USERNAME","EMAIL","PASSWORD","PHONE","ROLE")
        VALUES (p_name, p_username, p_email, p_password, p_phone, p_role);

        COMMIT;
        p_result := 'SUCCESS: User "' || p_username || '" registered.';
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; p_result := 'ERROR: ' || SQLERRM;
    END SP_REGISTER_USER;

    PROCEDURE SP_ADD_BOOKING(
        p_user_email    IN  VARCHAR2,
        p_bus_id        IN  NUMBER,
        p_bus_name      IN  VARCHAR2,
        p_from_district IN  VARCHAR2,
        p_to_district   IN  VARCHAR2,
        p_journey_date  IN  VARCHAR2,
        p_seats         IN  VARCHAR2,
        p_payment       IN  VARCHAR2,
        p_depart_time   IN  VARCHAR2,
        p_result        OUT VARCHAR2
    ) IS
        v_available  NUMBER;
        v_seat_count NUMBER;
    BEGIN
        v_available := FN_GET_AVAILABLE_SEATS(p_bus_id);
        IF v_available = -1 THEN
            p_result := 'ERROR: Bus ID ' || p_bus_id || ' not found.'; RETURN;
        END IF;

        v_seat_count := count_seats(p_seats);
        IF v_available < v_seat_count THEN
            p_result := 'ERROR: Only ' || v_available
                        || ' seat(s) available, requested ' || v_seat_count || '.';
            RETURN;
        END IF;

        INSERT INTO "BOOKINGS" (
            "USEREMAIL","BUSID","BUSNAME","FROMDISTRICT","TODISTRICT",
            "JOURNEYDATE","SEATS","PAYMENTMETHOD","DEPARTURETIME"
        ) VALUES (
            p_user_email, p_bus_id, p_bus_name, p_from_district, p_to_district,
            p_journey_date, p_seats, p_payment, p_depart_time
        );

        UPDATE "BUSES"
        SET    "AVAILABLESEATS" = "AVAILABLESEATS" - v_seat_count
        WHERE  "ID" = p_bus_id;

        COMMIT;
        p_result := 'SUCCESS: ' || v_seat_count || ' seat(s) booked on ' || p_bus_name || '.';
    EXCEPTION
        WHEN OTHERS THEN ROLLBACK; p_result := 'ERROR: ' || SQLERRM;
    END SP_ADD_BOOKING;

    PROCEDURE SP_SEARCH_BUSES(
        p_from_district IN  VARCHAR2,
        p_to_district   IN  VARCHAR2,
        p_journey_date  IN  VARCHAR2,
        p_cursor        OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT "ID","OPERATOR","BUSTYPE","DEPARTURETIME","FARE",
                   "AVAILABLESEATS","FROMDISTRICT","TODISTRICT",
                   "JOURNEYDATE","BOOKEDSEATS"
            FROM   "BUSES"
            WHERE  LOWER("FROMDISTRICT") = LOWER(p_from_district)
              AND  LOWER("TODISTRICT")   = LOWER(p_to_district)
              AND  "JOURNEYDATE"         = p_journey_date
              AND  "AVAILABLESEATS"      > 0
            ORDER  BY "DEPARTURETIME";
    EXCEPTION
        WHEN OTHERS THEN
            OPEN p_cursor FOR SELECT * FROM "BUSES" WHERE 1 = 0;
    END SP_SEARCH_BUSES;

    PROCEDURE SP_GET_USER_BOOKINGS(
        p_email  IN  VARCHAR2,
        p_cursor OUT SYS_REFCURSOR
    ) IS
    BEGIN
        OPEN p_cursor FOR
            SELECT bk."ID", bk."BUSNAME",
                   bk."FROMDISTRICT", bk."TODISTRICT",
                   bk."JOURNEYDATE",  bk."DEPARTURETIME",
                   bk."SEATS",        bk."PAYMENTMETHOD",
                   bk."TICKETISSUINGTIME",
                   FN_GET_BOOKING_STATUS(bk."ID") AS "COMPUTED_STATUS"
            FROM   "BOOKINGS" bk
            WHERE  LOWER(bk."USEREMAIL") = LOWER(p_email)
            ORDER  BY bk."TICKETISSUINGTIME" DESC;
    EXCEPTION
        WHEN OTHERS THEN
            OPEN p_cursor FOR SELECT * FROM "BOOKINGS" WHERE 1 = 0;
    END SP_GET_USER_BOOKINGS;

    PROCEDURE SP_GET_SUMMARY_REPORT(
        p_total_users    OUT NUMBER,
        p_total_admins   OUT NUMBER,
        p_total_buses    OUT NUMBER,
        p_total_bookings OUT NUMBER,
        p_upcoming       OUT NUMBER,
        p_completed      OUT NUMBER,
        p_cancelled      OUT NUMBER,
        p_total_revenue  OUT NUMBER
    ) IS
    BEGIN
        SELECT COUNT(*) INTO p_total_users    FROM "USERS"    WHERE "ROLE" = C_DEFAULT_ROLE;
        SELECT COUNT(*) INTO p_total_admins   FROM "USERS"    WHERE "ROLE" = 'Admin';
        SELECT COUNT(*) INTO p_total_buses    FROM "BUSES";
        SELECT COUNT(*) INTO p_total_bookings FROM "BOOKINGS";
        SELECT COUNT(*) INTO p_upcoming       FROM "BOOKINGS" WHERE "STATUS" = C_STATUS_UPCOMING;
        SELECT COUNT(*) INTO p_completed      FROM "BOOKINGS" WHERE "STATUS" = C_STATUS_COMPLETED;
        SELECT COUNT(*) INTO p_cancelled      FROM "BOOKINGS" WHERE "STATUS" = C_STATUS_CANCELLED;
        p_total_revenue := FN_GET_TOTAL_REVENUE();
    EXCEPTION
        WHEN OTHERS THEN
            p_total_users := 0; p_total_admins  := 0;
            p_total_buses := 0; p_total_bookings := 0;
            p_upcoming    := 0; p_completed     := 0;
            p_cancelled   := 0; p_total_revenue := 0;
    END SP_GET_SUMMARY_REPORT;

END PKG_BUS_TICKETING;
/

-- ================================================================
-- HOW TO CALL PACKAGE OBJECTS
-- ================================================================
--
-- PACKAGE FUNCTIONS:
--   SELECT PKG_BUS_TICKETING.FN_GET_AVAILABLE_SEATS(101) FROM DUAL;
--   SELECT PKG_BUS_TICKETING.FN_COUNT_USER_BOOKINGS('user@mail.com') FROM DUAL;
--   SELECT PKG_BUS_TICKETING.FN_IS_JOURNEY_UPCOMING('15/07/26','07:30 AM') FROM DUAL;
--   SELECT PKG_BUS_TICKETING.FN_GET_BOOKING_STATUS(5) FROM DUAL;
--   SELECT PKG_BUS_TICKETING.FN_GET_TOTAL_REVENUE() FROM DUAL;
--
-- PACKAGE PROCEDURES:
--   DECLARE v_res VARCHAR2(300);
--   BEGIN PKG_BUS_TICKETING.SP_CANCEL_BOOKING(5, v_res);
--         DBMS_OUTPUT.PUT_LINE(v_res); END;
--
--   DECLARE u NUMBER; ad NUMBER; b NUMBER; bk NUMBER;
--           up NUMBER; co NUMBER; ca NUMBER; rev NUMBER;
--   BEGIN
--     PKG_BUS_TICKETING.SP_GET_SUMMARY_REPORT(u,ad,b,bk,up,co,ca,rev);
--     DBMS_OUTPUT.PUT_LINE('Users: '||u||' | Buses: '||b||' | Revenue: '||rev);
--   END;
-- ================================================================
